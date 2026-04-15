import { NextFunction, Request, Response } from "express";
import { UserRole } from "../types/user.types";
import { AuthPayload } from "./auth.middleware";

const MANAGER_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.SUPERADMIN];

export const isManager = (user?: AuthPayload): boolean =>
  !!user && MANAGER_ROLES.includes(user.role);

export const isSuperAdmin = (user?: AuthPayload): boolean =>
  !!user && user.role === UserRole.SUPERADMIN;

export const requireRoles =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };

export const requireManager = requireRoles(
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
);

export const requireSuperAdmin = requireRoles(UserRole.SUPERADMIN);
