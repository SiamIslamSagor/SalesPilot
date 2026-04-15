import { FilterQuery } from "mongoose";
import User from "../models/user.model";
import {
  IUserDocument,
  ICreateUserDto,
  IUserResponseDto,
} from "../types/user.types";

class UserRepository {
  async create(userData: ICreateUserDto): Promise<IUserResponseDto> {
    const user = await User.create(userData);
    return this.toResponseDto(user);
  }

  async findById(id: string): Promise<IUserResponseDto | null> {
    const user = await User.findById(id);
    return user ? this.toResponseDto(user) : null;
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return await User.findOne({ email }).select("+password");
  }

  async findAll(
    filter: FilterQuery<IUserDocument> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    users: IUserResponseDto[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    return {
      users: users.map((user) => this.toResponseDto(user)),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async update(
    id: string,
    updateData: Partial<ICreateUserDto>,
  ): Promise<IUserResponseDto | null> {
    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    return user ? this.toResponseDto(user) : null;
  }

  async delete(id: string): Promise<IUserResponseDto | null> {
    const user = await User.findByIdAndDelete(id);
    return user ? this.toResponseDto(user) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email });
    return count > 0;
  }

  private toResponseDto(user: IUserDocument): IUserResponseDto {
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
      lastPasswordReset: user.lastPasswordReset || undefined,
    };
  }
}

export default new UserRepository();
