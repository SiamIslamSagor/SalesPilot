import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../middlewares/errorHandler.middleware";

const { mockUserRepo } = vi.hoisted(() => ({
  mockUserRepo: {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    existsByEmail: vi.fn(),
  },
}));

vi.mock("../repositories/user.repository", () => ({
  default: mockUserRepo,
}));

import userService from "../services/user.service";

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createUser", () => {
    it("creates user when email is unique", async () => {
      mockUserRepo.existsByEmail.mockResolvedValue(false);
      mockUserRepo.create.mockResolvedValue({
        _id: "u1",
        name: "John",
        email: "john@test.com",
        role: "admin",
      });

      const result = await userService.createUser({
        name: "John",
        email: "john@test.com",
        password: "Pass123!",
        role: "admin" as never,
      });

      expect(result).toEqual(
        expect.objectContaining({ name: "John", email: "john@test.com" }),
      );
    });

    it("throws AppError 409 when email exists", async () => {
      mockUserRepo.existsByEmail.mockResolvedValue(true);

      await expect(
        userService.createUser({
          name: "John",
          email: "exists@test.com",
          password: "Pass123!",
          role: "admin" as never,
        }),
      ).rejects.toThrow(AppError);
    });
  });

  describe("getUserById", () => {
    it("returns user when found", async () => {
      mockUserRepo.findById.mockResolvedValue({
        _id: "u1",
        name: "John",
        email: "john@test.com",
      });

      const result = await userService.getUserById("u1");
      expect(result.name).toBe("John");
    });

    it("throws AppError 404 when not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(userService.getUserById("notfound")).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("getAllUsers", () => {
    it("delegates to repository with filter and pagination", async () => {
      mockUserRepo.findAll.mockResolvedValue({
        users: [],
        total: 0,
        page: 1,
        pages: 0,
      });

      await userService.getAllUsers({ role: "admin" }, 2, 5);

      expect(mockUserRepo.findAll).toHaveBeenCalledWith(
        { role: "admin" },
        2,
        5,
      );
    });
  });

  describe("updateUser", () => {
    it("updates user when found and email unchanged", async () => {
      mockUserRepo.findById.mockResolvedValue({
        _id: "u1",
        email: "john@test.com",
      });
      mockUserRepo.update.mockResolvedValue({
        _id: "u1",
        name: "Updated",
        email: "john@test.com",
      });

      const result = await userService.updateUser("u1", { name: "Updated" });
      expect(result.name).toBe("Updated");
    });

    it("throws AppError 409 when changing to existing email", async () => {
      mockUserRepo.findById.mockResolvedValue({
        _id: "u1",
        email: "john@test.com",
      });
      mockUserRepo.existsByEmail.mockResolvedValue(true);

      await expect(
        userService.updateUser("u1", { email: "taken@test.com" }),
      ).rejects.toThrow(AppError);
    });

    it("throws AppError 404 when user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        userService.updateUser("notfound", { name: "X" }),
      ).rejects.toThrow(AppError);
    });
  });

  describe("deleteUser", () => {
    it("deletes user when found", async () => {
      mockUserRepo.findById.mockResolvedValue({ _id: "u1" });
      mockUserRepo.delete.mockResolvedValue({ _id: "u1", name: "John" });

      const result = await userService.deleteUser("u1");
      expect(result).toEqual(expect.objectContaining({ _id: "u1" }));
    });

    it("throws AppError 404 when user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(userService.deleteUser("notfound")).rejects.toThrow(
        AppError,
      );
    });
  });
});
