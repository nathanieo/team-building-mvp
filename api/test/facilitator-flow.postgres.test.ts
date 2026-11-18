/**
 * End-to-end HTTP test of facilitator login and the dashboard API against a real
 * PostgreSQL database. Skipped unless TEST_DATABASE_URL points at a migrated,
 * disposable database — every table is emptied before the run.
 *
 *   TEST_DATABASE_URL=postgresql://... npm test --workspace=@team-building-mvp/api
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Test } from "@nestjs/testing";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

const databaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)("facilitator flow (PostgreSQL)", () => {
  let application: NestExpressApplication;
  let baseUrl = "";

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.FACILITATOR_INVITE_CODE = "";
    const { AppModule } = await import("../src/app.module.js");
    const { configureApplication } = await import("../src/configure-application.js");
    const { PrismaService } = await import("../src/prisma/prisma.service.js");

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    application = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureApplication(application);
    await application.listen(0, "127.0.0.1");
    const address = (application.getHttpServer() as Server).address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}/api`;

    await application
      .get(PrismaService)
      .$executeRawUnsafe(
        'TRUNCATE "teams", "projects", "students", "cohorts", "facilitator_sessions", "facilitators" CASCADE',
      );
  });

  afterAll(async () => {
    await application?.close();
  });

  async function call(path: string, init: RequestInit & { cookie?: string } = {}) {
    const headers = new Headers(init.headers);
    if (init.body) headers.set("Content-Type", "application/json");
    if (init.cookie) headers.set("Cookie", init.cookie);
    const response = await fetch(baseUrl + path, { ...init, headers });
    const text = await response.text();
    return {
      status: response.status,
      body: text ? (JSON.parse(text) as Record<string, unknown>) : null,
      cookie: response.headers.get("set-cookie")?.split(";")[0] ?? null,
    };
  }

  const account = {
    displayName: "Dr. Kim",
    username: "dr.kim",
    email: "kim@wichita.edu",
    password: "correct horse battery",
  };
  let cookie = "";

  it("registers a facilitator and sets an HttpOnly session cookie", async () => {
    const result = await call("/auth/register", { method: "POST", body: JSON.stringify(account) });
    expect(result.status).toBe(201);
    expect(result.body).toEqual({
      facilitator: {
        id: expect.any(String),
        email: account.email,
        username: account.username,
        displayName: account.displayName,
      },
    });
    expect(result.cookie).toMatch(/^tb_session=/);
  });

  it("rejects duplicate emails regardless of case", async () => {
    const result = await call("/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...account, email: "KIM@wichita.edu" }),
    });
    expect(result.status).toBe(400);
    expect(result.body?.fieldErrors).toHaveProperty("email");
  });

  it("rejects duplicate usernames regardless of case", async () => {
    const result = await call("/auth/register", {
      method: "POST",
      body: JSON.stringify({ ...account, email: "someone.else@wichita.edu", username: "Dr.Kim" }),
    });
    expect(result.status).toBe(400);
    expect(result.body?.fieldErrors).toHaveProperty("username");
    expect(result.body?.fieldErrors).not.toHaveProperty("email");
  });

  it("logs in with the right password only", async () => {
    const wrong = await call("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: account.email, password: "not the password" }),
    });
    expect(wrong.status).toBe(401);

    const byUsername = await call("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: "DR.KIM", password: account.password }),
    });
    expect(byUsername.status).toBe(200);

    const right = await call("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: account.email, password: account.password }),
    });
    expect(right.status).toBe(200);
    cookie = right.cookie ?? "";
    expect(cookie).not.toBe("");
  });

  it("protects the dashboard API", async () => {
    expect((await call("/cohorts")).status).toBe(401);
    expect((await call("/cohorts", { cookie })).body).toEqual({ cohorts: [] });
  });

  it("creates a class with a join code and lists it", async () => {
    const created = await call("/cohorts", {
      method: "POST",
      cookie,
      body: JSON.stringify({ name: "CS 665 Senior Design", term: "Spring 2027", teamSize: 4 }),
    });
    expect(created.status).toBe(201);
    const cohort = created.body?.cohort as Record<string, unknown>;
    expect(cohort).toMatchObject({ name: "CS 665 Senior Design", status: "collecting", studentCount: 0 });
    expect(cohort.joinCode).toMatch(/^[A-Z2-9]{6}$/);

    const listed = await call("/cohorts", { cookie });
    expect(listed.body?.cohorts).toHaveLength(1);
    expect((await call(`/cohorts/${String(cohort.id)}`, { cookie })).status).toBe(200);
  });

  it("hides other facilitators' classes", async () => {
    const other = await call("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        displayName: "Dr. Lee",
        username: "drlee",
        email: "lee@wichita.edu",
        password: "another long password",
      }),
    });
    const otherCookie = other.cookie ?? "";
    const mine = ((await call("/cohorts", { cookie })).body?.cohorts ?? []) as Array<{ id: string }>;
    const firstId = mine[0]?.id ?? "";
    expect(firstId).not.toBe("");
    expect((await call("/cohorts", { cookie: otherCookie })).body).toEqual({ cohorts: [] });
    expect((await call(`/cohorts/${firstId}`, { cookie: otherCookie })).status).toBe(404);
  });

  it("ends the session on logout", async () => {
    expect((await call("/auth/logout", { method: "POST", cookie })).status).toBe(204);
    expect((await call("/auth/me", { cookie })).status).toBe(401);
  });
});
