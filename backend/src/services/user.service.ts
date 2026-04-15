import userRepository from "../repositories/user.repository";
import { ICreateUserDto, IUserResponseDto } from "../types/user.types";
import { AppError } from "../middlewares/errorHandler.middleware";

class UserService {
  async createUser(userData: ICreateUserDto): Promise<IUserResponseDto> {
    // Check if user with this email already exists
    const emailExists = await userRepository.existsByEmail(userData.email);
    if (emailExists) {
      throw new AppError("User with this email already exists", 409);
    }

    // Create the user (password will be hashed in the model pre-save hook)
    return await userRepository.create(userData);
  }

  async getUserById(id: string): Promise<IUserResponseDto> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async getAllUsers(
    filter: Record<string, unknown> = {},
    page: number = 1,
    limit: number = 10,
  ) {
    return await userRepository.findAll(filter, page, limit);
  }

  async updateUser(
    id: string,
    updateData: Partial<ICreateUserDto>,
  ): Promise<IUserResponseDto> {
    // Check if user exists
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    // If email is being updated, check if it's already taken by another user
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await userRepository.existsByEmail(updateData.email);
      if (emailExists) {
        throw new AppError("Email already in use", 409);
      }
    }

    const updatedUser = await userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new AppError("Failed to update user", 500);
    }
    return updatedUser;
  }

  async deleteUser(id: string): Promise<IUserResponseDto> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const deletedUser = await userRepository.delete(id);
    if (!deletedUser) {
      throw new AppError("Failed to delete user", 500);
    }
    return deletedUser;
  }
}

export default new UserService();
