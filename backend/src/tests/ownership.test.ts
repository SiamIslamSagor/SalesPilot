import { describe, it, expect } from "vitest";
import {
  canAccessOwnedEntity,
  hasStoredOwner,
  normalizeEmail,
  getOwnershipFields,
  getOwnershipFilter,
} from "../utils/ownership";
import { UserRole } from "../types/user.types";
import { AuthPayload } from "../middlewares/auth.middleware";

const admin = (overrides: Partial<AuthPayload> = {}): AuthPayload => ({
  userId: "user1",
  email: "admin@test.com",
  role: UserRole.ADMIN,
  ...overrides,
});

const superAdmin = (): AuthPayload => ({
  userId: "su1",
  email: "super@test.com",
  role: UserRole.SUPERADMIN,
});

describe("normalizeEmail", () => {
  it("lowercases and trims email", () => {
    expect(normalizeEmail(" Admin@Test.Com ")).toBe("admin@test.com");
  });

  it("returns empty string for null/undefined", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
  });
});

describe("hasStoredOwner", () => {
  it("returns true when entity has ownerUserId", () => {
    expect(hasStoredOwner({ ownerUserId: "user1" })).toBe(true);
  });

  it("returns true when entity has ownerUserEmail", () => {
    expect(hasStoredOwner({ ownerUserEmail: "a@b.com" })).toBe(true);
  });

  it("returns false for entity with no owner fields", () => {
    expect(hasStoredOwner({})).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(hasStoredOwner(null)).toBe(false);
    expect(hasStoredOwner(undefined)).toBe(false);
  });
});

describe("getOwnershipFields", () => {
  it("extracts userId and normalised email from user", () => {
    const fields = getOwnershipFields(admin({ name: "Admin" }));
    expect(fields).toEqual({
      ownerUserId: "user1",
      ownerUserName: "Admin",
      ownerUserEmail: "admin@test.com",
    });
  });

  it("falls back to email for ownerUserName when name is missing", () => {
    const fields = getOwnershipFields(admin({ name: undefined }));
    expect(fields.ownerUserName).toBe("admin@test.com");
  });
});

describe("canAccessOwnedEntity", () => {
  it("returns false when user is undefined", () => {
    expect(canAccessOwnedEntity(undefined, { ownerUserId: "u1" })).toBe(false);
  });

  it("returns false when entity is null", () => {
    expect(canAccessOwnedEntity(admin(), null)).toBe(false);
  });

  it("super admin can access any entity", () => {
    expect(
      canAccessOwnedEntity(superAdmin(), { ownerUserId: "someone-else" }),
    ).toBe(true);
  });

  it("owner can access by userId match", () => {
    expect(canAccessOwnedEntity(admin(), { ownerUserId: "user1" })).toBe(true);
  });

  it("owner can access by email match (case-insensitive)", () => {
    expect(
      canAccessOwnedEntity(admin(), {
        ownerUserEmail: "ADMIN@test.com",
      }),
    ).toBe(true);
  });

  it("non-owner admin cannot access", () => {
    expect(canAccessOwnedEntity(admin(), { ownerUserId: "other-user" })).toBe(
      false,
    );
  });

  it("admin can access legacy entities without owner fields", () => {
    expect(canAccessOwnedEntity(admin(), {})).toBe(true);
  });
});

describe("getOwnershipFilter", () => {
  it("returns empty object for superadmin", () => {
    expect(getOwnershipFilter(superAdmin())).toEqual({});
  });

  it("returns empty object for undefined user", () => {
    expect(getOwnershipFilter(undefined)).toEqual({});
  });

  it("returns $or filter for admin user", () => {
    const filter = getOwnershipFilter(admin());
    expect(filter).toEqual({
      $or: [{ ownerUserId: "user1" }, { ownerUserEmail: "admin@test.com" }],
    });
  });
});
