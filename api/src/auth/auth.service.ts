import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import type {
  Facilitator,
  FacilitatorLoginRequest,
  FacilitatorRegisterRequest,
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

/** Same message for unknown email and wrong password so accounts can't be probed. */
const INVALID_LOGIN = "That email and password don't match an account.";

function toFacilitator(record: { id: string; email: string; displayName: string }): Facilitator {
  return { id: record.id, email: record.email, displayName: record.displayName };
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

    try {
      const record = await this.prisma.facilitator.create({
        data: {
          email: request.email,
          displayName: request.displayName,
          passwordHash: await hashPassword(request.password),
        },
      });
      return this.issueSession(toFacilitator(record));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw validationError({ email: "An account with this email already exists. Log in instead." });
      }
      throw error;
    }
  }

  async login(request: FacilitatorLoginRequest, clientKey: string): Promise<IssuedSession> {
    const limitKey = `${request.email}|${clientKey}`;
    if (this.limiter.isBlocked(limitKey)) {
      throw apiError(
        HttpStatus.TOO_MANY_REQUESTS,
        "Too many failed attempts. Wait 15 minutes and try again.",
      );
    }

    const record = await this.prisma.facilitator.findUnique({ where: { email: request.email } });
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
