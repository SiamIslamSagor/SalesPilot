import { Document } from "mongoose";

export enum UserRole {
  ADMIN = "admin" /* eslint-disable-line */,
  SUPERADMIN = "superadmin" /* eslint-disable-line */,
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  lastPasswordReset?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: string;
  comparePassword(
    /* eslint-disable-line */ candidatePassword: string,
  ): Promise<boolean>;
}

export interface ICreateUserDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface IUserResponseDto {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastPasswordReset?: Date;
}
