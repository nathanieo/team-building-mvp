import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import { isEmailIdentifier } from "@team-building-mvp/contracts";
import type {
  Facilitator,
  FacilitatorLoginRequest,
  FacilitatorRegisterRequest,
  RegisterField,
} from "@team-building-mvp/contracts";
import { API_CONFIG } from "../config.js";
import type { ApiConfig } from "../config.js";
import { Prisma } from "../generated/prisma/client.js";
import { apiError, validationError } from "../http/errors.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { LoginRateLimiter } from "./login-rate-limiter.js";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "./password.js";
import { createSessionToken, hashSessionToken } from "./session-token.js";

export interface IssuedSession {
  facilitator: Facilitator;
  token: string;
  maxAgeSeconds: number;
}

/** Same message for an unknown username/email and a wrong password so accounts can't be probed. */
const INVALID_LOGIN = "Those details don't match an account. Check your username or email and password.";

const EMAIL_TAKEN = "An account with this email already exists. Log in instead.";
const USERNAME_TAKEN = "That username is taken. Try another.";

function toFacilitator(record: {
  id: string;
  email: string;
  username: string | null;
  displayName: string;
}): Facilitator {
  return { id: record.id, email: record.email, username: record.username, displayName: record.displayName };
}

function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

@Injectable()
export class AuthService {
  private readonly limiter = new LoginRateLimiter();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  private get maxAgeSeconds(): number {
    return this.config.sessionTtlHours * 60 * 60;
  }

  private async issueSession(facilitator: Facilitator): Promise<IssuedSession> {
    const token = createSessionToken();
    await this.prisma.facilitatorSession.create({
      data: {
        tokenHash: hashSessionToken(token),
        facilitatorId: facilitator.id,
        expiresAt: new Date(Date.now() + this.maxAgeSeconds * 1000),
      },
    });
    return { facilitator, token, maxAgeSeconds: this.maxAgeSeconds };
  }

  async register(request: FacilitatorRegisterRequest): Promise<IssuedSession> {
    const requiredCode = this.config.facilitatorInviteCode;
    if (requiredCode && !sameSecret(request.inviteCode, requiredCode)) {
      throw validationError({ inviteCode: "Enter the invite code from your administrator." });
    }

    // Check first so the person learns which field is taken (and both if both are).
    const existing = await this.prisma.facilitator.findMany({
      where: { OR: [{ email: request.email }, { username: request.username }] },
      select: { email: true, username: true },
    });
    const taken: Partial<Record<RegisterField, string>> = {};
    if (existing.some((record) => record.email === request.email)) taken.email = EMAIL_TAKEN;
    if (existing.some((record) => record.username === request.username)) taken.username = USERNAME_TAKEN;
    if (Object.keys(taken).length > 0) throw validationError(taken);

    try {
      const record = await this.prisma.facilitator.create({
        data: {
          email: request.email,
          username: request.username,
          displayName: request.displayName,
          passwordHash: await hashPassword(request.password),
        },
      });
      return this.issueSession(toFacilitator(record));
    } catch (error) {
      // Two sign-ups racing for the same email or username between the check and the insert.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const clash = JSON.stringify(error.meta ?? {});
        throw validationError(clash.includes("username") ? { username: USERNAME_TAKEN } : { email: EMAIL_TAKEN });
      }
      throw error;
    }
  }

  async login(request: FacilitatorLoginRequest, clientKey: string): Promise<IssuedSession> {
    const limitKey = `${request.identifier}|${clientKey}`;
    if (this.limiter.isBlocked(limitKey)) {
      throw apiError(
        HttpStatus.TOO_MANY_REQUESTS,
        "Too many failed attempts. Wait 15 minutes and try again.",
      );
    }

    const record = await this.prisma.facilitator.findUnique({
      where: isEmailIdentifier(request.identifier) ? { email: request.identifier } : { username: request.identifier },
    });
    const passwordMatches = await verifyPassword(
      request.password,
      record?.passwordHash ?? (await DUMMY_PASSWORD_HASH),
    );

    if (!record || !passwordMatches) {
      this.limiter.recordFailure(limitKey);
      throw apiError(HttpStatus.UNAUTHORIZED, INVALID_LOGIN);
    }

    this.limiter.reset(limitKey);
    return this.issueSession(toFacilitator(record));
  }

  /** Returns the logged-in facilitator, or null for a missing or expired session. */
  async findBySessionToken(token: string): Promise<Facilitator | null> {
    const session = await this.prisma.facilitatorSession.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { facilitator: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.facilitatorSession.deleteMany({ where: { id: session.id } });
      return null;
    }
    return toFacilitator(session.facilitator);
  }

  async logout(token: string): Promise<void> {
    await this.prisma.facilitatorSession.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }
}
