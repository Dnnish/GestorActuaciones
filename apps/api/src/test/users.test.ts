import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { db, users } from "@minidrive/db";
import { eq, sql } from "drizzle-orm";
import { buildApp, createAuthenticatedUser } from "./setup.js";

let app: FastifyInstance;
let superadminCookies: string;
let superadminUser: Record<string, unknown>;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await db.execute(sql`TRUNCATE users, sessions, accounts, verifications CASCADE`);

  const result = await createAuthenticatedUser(app, {
    email: "superadmin@test.com",
    password: "12345678",
    name: "Super Admin",
    role: "superadmin",
  });
  superadminCookies = result.cookies;
  superadminUser = result.user;
});

describe("GET /api/users", () => {
  it("returns user list as superadmin", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: { cookie: superadminCookies },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
    expect(body[0].email).toBe("superadmin@test.com");
  });

  it("returns 403 as admin", async () => {
    const { cookies } = await createAuthenticatedUser(app, {
      email: "admin@test.com",
      password: "12345678",
      name: "Admin",
      role: "admin",
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: { cookie: cookies },
    });

    expect(res.statusCode).toBe(403);
  });

  it("returns 403 as regular user", async () => {
    const { cookies } = await createAuthenticatedUser(app, {
      email: "user@test.com",
      password: "12345678",
      name: "User",
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: { cookie: cookies },
    });

    expect(res.statusCode).toBe(403);
  });

  it("excludes soft-deleted users by default", async () => {
    const { user } = await createAuthenticatedUser(app, {
      email: "deleted@test.com",
      password: "12345678",
      name: "Deleted",
    });

    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, user.id as string));

    const res = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: { cookie: superadminCookies },
    });

    const body = res.json();
    const emails = body.map((u: { email: string }) => u.email);
    expect(emails).not.toContain("deleted@test.com");
  });

  it("includes soft-deleted users with includeDeleted=true", async () => {
    const { user } = await createAuthenticatedUser(app, {
      email: "deleted@test.com",
      password: "12345678",
      name: "Deleted",
    });

    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, user.id as string));

    const res = await app.inject({
      method: "GET",
      url: "/api/users?includeDeleted=true",
      headers: { cookie: superadminCookies },
    });

    const body = res.json();
    const emails = body.map((u: { email: string }) => u.email);
    expect(emails).toContain("deleted@test.com");
  });
});

describe("POST /api/users", () => {
  it("creates user with specified role", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { cookie: superadminCookies },
      payload: {
        code: "1234567890",
        password: "12345678",
        name: "New Admin",
        role: "admin",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.email).toBe("1234567890@minidrive.com");
    expect(body.role).toBe("admin");
  });

  it("returns 409 for duplicate code", async () => {
    // First create via API
    await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { cookie: superadminCookies },
      payload: {
        code: "9999999999",
        password: "12345678",
        name: "First",
        role: "user",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { cookie: superadminCookies },
      payload: {
        code: "9999999999",
        password: "12345678",
        name: "Duplicate",
        role: "user",
      },
    });

    expect(res.statusCode).toBe(409);
  });

  it("returns 400 for invalid input", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { cookie: superadminCookies },
      payload: {
        code: "abc",
        password: "123",
        name: "",
      },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("PATCH /api/users/:id", () => {
  it("updates user name", async () => {
    const { user } = await createAuthenticatedUser(app, {
      email: "edit@test.com",
      password: "12345678",
      name: "Before",
    });

    const res = await app.inject({
      method: "PATCH",
      url: `/api/users/${user.id}`,
      headers: { cookie: superadminCookies },
      payload: { name: "After" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("After");
  });

  it("returns 409 for duplicate code on update", async () => {
    // Create a user via API with a known code
    await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { cookie: superadminCookies },
      payload: {
        code: "1111111111",
        password: "12345678",
        name: "First User",
        role: "user",
      },
    });

    const createRes = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { cookie: superadminCookies },
      payload: {
        code: "2222222222",
        password: "12345678",
        name: "Second User",
        role: "user",
      },
    });
    const secondUser = createRes.json();

    const res = await app.inject({
      method: "PATCH",
      url: `/api/users/${secondUser.id}`,
      headers: { cookie: superadminCookies },
      payload: { code: "1111111111" },
    });

    expect(res.statusCode).toBe(409);
  });
});

describe("DELETE /api/users/:id", () => {
  it("soft deletes user", async () => {
    const { user } = await createAuthenticatedUser(app, {
      email: "todelete@test.com",
      password: "12345678",
      name: "To Delete",
    });

    const res = await app.inject({
      method: "DELETE",
      url: `/api/users/${user.id}`,
      headers: { cookie: superadminCookies },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().deletedAt).toBeDefined();

    const inDb = await db.select().from(users).where(eq(users.id, user.id as string));
    expect(inDb[0].deletedAt).not.toBeNull();
  });

  it("returns 400 when trying to self-delete", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/users/${superadminUser.id}`,
      headers: { cookie: superadminCookies },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for non-existent user", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/users/00000000-0000-0000-0000-000000000000",
      headers: { cookie: superadminCookies },
    });

    expect(res.statusCode).toBe(404);
  });
});
