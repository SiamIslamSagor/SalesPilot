import mongoose from "mongoose";

export const name = "002_backfill_record_owners";

type UserRecord = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
};

type OwnerFields = {
  ownerUserId?: string;
  ownerUserName?: string;
  ownerUserEmail?: string;
};

const normalizeEmail = (email?: string | null) =>
  email?.trim().toLowerCase() || "";

const normalizeName = (nameValue?: string | null) =>
  nameValue?.trim().toLowerCase() || "";

const isMissing = (value?: string | null) => !value || !String(value).trim();

const buildUserIndexes = (users: UserRecord[]) => {
  const byId = new Map<string, UserRecord>();
  const byEmail = new Map<string, UserRecord>();
  const nameCounts = new Map<string, number>();

  for (const user of users) {
    byId.set(user._id.toString(), user);

    const email = normalizeEmail(user.email);
    if (email) {
      byEmail.set(email, user);
    }

    const normalizedName = normalizeName(user.name);
    if (normalizedName) {
      nameCounts.set(normalizedName, (nameCounts.get(normalizedName) || 0) + 1);
    }
  }

  const byUniqueName = new Map<string, UserRecord>();
  for (const user of users) {
    const normalizedName = normalizeName(user.name);
    if (normalizedName && nameCounts.get(normalizedName) === 1) {
      byUniqueName.set(normalizedName, user);
    }
  }

  return { byId, byEmail, byUniqueName };
};

const toOwnerFields = (user: UserRecord): OwnerFields => ({
  ownerUserId: user._id.toString(),
  ownerUserName: user.name || user.email || user._id.toString(),
  ownerUserEmail: normalizeEmail(user.email),
});

const ownersEqual = (current: OwnerFields, next: OwnerFields): boolean =>
  current.ownerUserId === next.ownerUserId &&
  normalizeEmail(current.ownerUserEmail) ===
    normalizeEmail(next.ownerUserEmail) &&
  (current.ownerUserName || "") === (next.ownerUserName || "");

export async function up(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database not connected");
  }

  const usersCollection = db.collection<UserRecord>("users");
  const offersCollection = db.collection("offers");
  const ordersCollection = db.collection("orders");

  const users = await usersCollection
    .find({}, { projection: { _id: 1, name: 1, email: 1 } })
    .toArray();
  const userIndexes = buildUserIndexes(users);

  const resolveFromCandidates = (
    candidates: Array<string | undefined>,
  ): UserRecord | null => {
    for (const candidate of candidates) {
      const email = normalizeEmail(candidate);
      if (email && userIndexes.byEmail.has(email)) {
        return userIndexes.byEmail.get(email) || null;
      }
    }

    for (const candidate of candidates) {
      const normalizedName = normalizeName(candidate);
      if (normalizedName && userIndexes.byUniqueName.has(normalizedName)) {
        return userIndexes.byUniqueName.get(normalizedName) || null;
      }
    }

    return null;
  };

  const resolveOwnerFields = (record: {
    ownerUserId?: string;
    ownerUserName?: string;
    ownerUserEmail?: string;
    salesperson?: string;
  }): OwnerFields | null => {
    if (!isMissing(record.ownerUserId)) {
      const user = userIndexes.byId.get(String(record.ownerUserId));
      if (user) {
        return toOwnerFields(user);
      }
    }

    const matchedUser = resolveFromCandidates([
      record.ownerUserEmail,
      record.ownerUserName,
      record.salesperson,
    ]);

    if (matchedUser) {
      return toOwnerFields(matchedUser);
    }

    if (!isMissing(record.ownerUserId) || !isMissing(record.ownerUserEmail)) {
      return {
        ownerUserId: isMissing(record.ownerUserId)
          ? undefined
          : String(record.ownerUserId),
        ownerUserName: isMissing(record.ownerUserName)
          ? undefined
          : record.ownerUserName,
        ownerUserEmail: normalizeEmail(record.ownerUserEmail) || undefined,
      };
    }

    return null;
  };

  const offerOwnerById = new Map<string, OwnerFields>();
  const offerDocs = await offersCollection
    .find(
      {},
      {
        projection: {
          _id: 1,
          ownerUserId: 1,
          ownerUserName: 1,
          ownerUserEmail: 1,
        },
      },
    )
    .toArray();

  let updatedOffers = 0;
  let unresolvedOffers = 0;

  for (const offer of offerDocs) {
    const currentOwner: OwnerFields = {
      ownerUserId: offer.ownerUserId,
      ownerUserName: offer.ownerUserName,
      ownerUserEmail: normalizeEmail(offer.ownerUserEmail),
    };
    const resolvedOwner = resolveOwnerFields(currentOwner);

    if (!resolvedOwner) {
      unresolvedOffers++;
      continue;
    }

    offerOwnerById.set(offer._id.toString(), resolvedOwner);

    if (ownersEqual(currentOwner, resolvedOwner)) {
      continue;
    }

    await offersCollection.updateOne(
      { _id: offer._id },
      {
        $set: {
          ownerUserId: resolvedOwner.ownerUserId,
          ownerUserName: resolvedOwner.ownerUserName,
          ownerUserEmail: resolvedOwner.ownerUserEmail,
        },
      },
    );
    updatedOffers++;
  }

  const orderDocs = await ordersCollection
    .find(
      {},
      {
        projection: {
          _id: 1,
          offerId: 1,
          ownerUserId: 1,
          ownerUserName: 1,
          ownerUserEmail: 1,
          salesperson: 1,
        },
      },
    )
    .toArray();

  let updatedOrders = 0;
  let unresolvedOrders = 0;

  for (const order of orderDocs) {
    const currentOwner: OwnerFields = {
      ownerUserId: order.ownerUserId,
      ownerUserName: order.ownerUserName,
      ownerUserEmail: normalizeEmail(order.ownerUserEmail),
    };

    const inheritedOwner =
      typeof order.offerId === "string"
        ? offerOwnerById.get(order.offerId)
        : undefined;

    const resolvedOwner =
      inheritedOwner ||
      resolveOwnerFields({
        ...currentOwner,
        salesperson:
          typeof order.salesperson === "string" ? order.salesperson : undefined,
      });

    if (!resolvedOwner) {
      unresolvedOrders++;
      continue;
    }

    if (ownersEqual(currentOwner, resolvedOwner)) {
      continue;
    }

    await ordersCollection.updateOne(
      { _id: order._id },
      {
        $set: {
          ownerUserId: resolvedOwner.ownerUserId,
          ownerUserName: resolvedOwner.ownerUserName,
          ownerUserEmail: resolvedOwner.ownerUserEmail,
        },
      },
    );
    updatedOrders++;
  }

  console.log(`  ✅ Backfilled owner metadata for ${updatedOffers} offers`);
  console.log(`  ✅ Backfilled owner metadata for ${updatedOrders} orders`);
  if (unresolvedOffers > 0 || unresolvedOrders > 0) {
    console.log(
      `  ⚠️  ${unresolvedOffers} offers and ${unresolvedOrders} orders still need manual owner assignment`,
    );
  }
}
