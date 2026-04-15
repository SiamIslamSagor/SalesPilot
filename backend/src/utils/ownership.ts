import { AuthPayload } from "../middlewares/auth.middleware";
import { isManager, isSuperAdmin } from "../middlewares/authorization.middleware";

export interface OwnedEntity {
  ownerUserId?: string | null;
  ownerUserName?: string | null;
  ownerUserEmail?: string | null;
}

export const normalizeEmail = (email?: string | null) =>
  email?.trim().toLowerCase() || "";

export const hasStoredOwner = (entity?: OwnedEntity | null): boolean =>
  !!entity &&
  (Boolean(entity.ownerUserId) ||
    Boolean(normalizeEmail(entity.ownerUserEmail)));

export const getOwnershipFields = (user?: AuthPayload): OwnedEntity => ({
  ownerUserId: user?.userId,
  ownerUserName: user?.name || user?.email,
  ownerUserEmail: normalizeEmail(user?.email),
});

export const canAccessOwnedEntity = (
  user: AuthPayload | undefined,
  entity: OwnedEntity | null,
): boolean => {
  if (!entity || !user) {
    return false;
  }

  if (isSuperAdmin(user)) {
    return true;
  }

  if (!hasStoredOwner(entity)) {
    // Legacy records without owner fields: allow managers to access them
    return isManager(user);
  }

  return (
    entity.ownerUserId === user.userId ||
    normalizeEmail(entity.ownerUserEmail) === normalizeEmail(user.email)
  );
};

export const getOwnershipFilter = (
  user?: AuthPayload,
): Record<string, unknown> => {
  if (!user || isSuperAdmin(user)) {
    return {};
  }

  return {
    $or: [
      { ownerUserId: user.userId },
      { ownerUserEmail: normalizeEmail(user.email) },
    ],
  };
};
