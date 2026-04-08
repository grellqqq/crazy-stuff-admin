'use server';

import { redirect } from 'next/navigation';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getDB } from '@/lib/db';
import {
  verifyPassword,
  generateToken,
  setAuthCookie,
  clearAuthCookie,
} from '@/lib/auth';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function loginAction(password: string): Promise<{ error?: string }> {
  if (!verifyPassword(password)) {
    return { error: 'Invalid password' };
  }
  const token = generateToken();
  await setAuthCookie(token);
  redirect('/');
}

export async function logoutAction(): Promise<void> {
  await clearAuthCookie();
  redirect('/login');
}

// ---------------------------------------------------------------------------
// Players — stats
// ---------------------------------------------------------------------------

export async function updatePlayer(
  id: string,
  data: {
    username?: string;
    xp?: number;
    level?: number;
    coins?: number;
    totalRaces?: number;
    totalWins?: number;
    equippedChar?: string;
  }
): Promise<void> {
  const db = await getDB();
  await db.collection('players').updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...data, updatedAt: new Date() } }
  );
}

// ---------------------------------------------------------------------------
// Players — account (user record)
// ---------------------------------------------------------------------------

export async function updateUser(
  userId: string,
  data: { username?: string; email?: string }
): Promise<void> {
  const db = await getDB();
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { ...data } }
  );
}

export async function resetPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  const db = await getDB();
  const hash = await bcrypt.hash(newPassword, 12);
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { passwordHash: hash } }
  );
}

// ---------------------------------------------------------------------------
// Players — delete
// ---------------------------------------------------------------------------

export async function deletePlayer(id: string): Promise<void> {
  const db = await getDB();
  const player = await db
    .collection('players')
    .findOne({ _id: new ObjectId(id) });

  if (!player) return;

  await Promise.all([
    db.collection('players').deleteOne({ _id: new ObjectId(id) }),
    db.collection('inventory').deleteMany({ playerId: new ObjectId(id) }),
    db.collection('users').deleteOne({ _id: player.userId }),
  ]);

  redirect('/players');
}

export async function bulkDeletePlayers(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDB();
  const objectIds = ids.map((id) => new ObjectId(id));

  // Find all players to get their userIds
  const players = await db
    .collection('players')
    .find({ _id: { $in: objectIds } })
    .toArray();

  const userIds = players
    .map((p) => p.userId)
    .filter(Boolean)
    .map((uid) => (typeof uid === 'string' ? new ObjectId(uid) : uid));

  await Promise.all([
    db.collection('players').deleteMany({ _id: { $in: objectIds } }),
    db.collection('inventory').deleteMany({ playerId: { $in: objectIds } }),
    db.collection('users').deleteMany({ _id: { $in: userIds } }),
  ]);
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export async function addItem(
  playerId: string,
  itemType: string,
  itemId: string,
  rarity: string
): Promise<void> {
  const db = await getDB();
  await db.collection('inventory').insertOne({
    playerId: new ObjectId(playerId),
    itemType,
    itemId,
    rarity,
    equipped: false,
    obtainedAt: new Date(),
  });
}

export async function updateItem(
  itemMongoId: string,
  data: { itemType?: string; itemId?: string; rarity?: string }
): Promise<void> {
  const db = await getDB();
  await db.collection('inventory').updateOne(
    { _id: new ObjectId(itemMongoId) },
    { $set: data }
  );
}

export async function deleteItem(itemId: string): Promise<void> {
  const db = await getDB();
  await db.collection('inventory').deleteOne({ _id: new ObjectId(itemId) });
}

export async function toggleEquip(itemId: string): Promise<void> {
  const db = await getDB();
  const item = await db
    .collection('inventory')
    .findOne({ _id: new ObjectId(itemId) });
  if (!item) return;
  await db
    .collection('inventory')
    .updateOne(
      { _id: new ObjectId(itemId) },
      { $set: { equipped: !item.equipped } }
    );
}

export async function giveItemToAll(
  itemType: string,
  itemId: string,
  rarity: string
): Promise<{ count: number }> {
  const db = await getDB();
  const players = await db
    .collection('players')
    .find({}, { projection: { _id: 1 } })
    .toArray();

  if (players.length === 0) return { count: 0 };

  const docs = players.map((p) => ({
    playerId: p._id,
    itemType,
    itemId,
    rarity,
    equipped: false,
    obtainedAt: new Date(),
  }));

  await db.collection('inventory').insertMany(docs);
  return { count: players.length };
}
