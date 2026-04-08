'use server';

import { redirect } from 'next/navigation';
import { ObjectId } from 'mongodb';
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
// Players
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
