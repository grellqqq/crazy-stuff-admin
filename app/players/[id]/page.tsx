import { requireAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { notFound } from 'next/navigation';
import {
  updatePlayer,
  deletePlayer,
  addItem,
  deleteItem,
  toggleEquip,
} from '@/app/actions';

async function getPlayerWithInventory(id: string) {
  const db = await getDB();
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return null;
  }
  const [player, inventory] = await Promise.all([
    db.collection('players').findOne({ _id: oid }),
    db.collection('inventory').find({ playerId: oid }).sort({ obtainedAt: -1 }).toArray(),
  ]);
  return player ? { player, inventory } : null;
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const result = await getPlayerWithInventory(id);
  if (!result) notFound();

  const { player, inventory } = result;

  // Server actions bound to this player
  async function handleUpdate(formData: FormData) {
    'use server';
    await updatePlayer(id, {
      username: formData.get('username') as string,
      xp: Number(formData.get('xp')),
      level: Number(formData.get('level')),
      coins: Number(formData.get('coins')),
      totalRaces: Number(formData.get('totalRaces')),
      totalWins: Number(formData.get('totalWins')),
      equippedChar: formData.get('equippedChar') as string,
    });
  }

  async function handleDelete() {
    'use server';
    await deletePlayer(id);
  }

  async function handleAddItem(formData: FormData) {
    'use server';
    await addItem(
      id,
      formData.get('itemType') as string,
      formData.get('itemId') as string,
      formData.get('rarity') as string
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/players" className="text-blue-400 hover:text-blue-300 text-sm">
          ← Players
        </a>
        <span className="text-gray-600">/</span>
        <h1 className="text-2xl font-bold text-yellow-400">{player.username}</h1>
      </div>

      {/* Edit Stats Form */}
      <section className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Edit Stats</h2>
        <form action={handleUpdate} className="grid grid-cols-2 gap-4">
          <Field name="username" label="Username" defaultValue={player.username} />
          <Field name="level" label="Level" type="number" defaultValue={player.level ?? 1} />
          <Field name="xp" label="XP" type="number" defaultValue={player.xp ?? 0} />
          <Field name="coins" label="Coins" type="number" defaultValue={player.coins ?? 0} />
          <Field name="totalRaces" label="Total Races" type="number" defaultValue={player.totalRaces ?? 0} />
          <Field name="totalWins" label="Total Wins" type="number" defaultValue={player.totalWins ?? 0} />
          <div className="col-span-2">
            <Field name="equippedChar" label="Equipped Character" defaultValue={player.equippedChar ?? ''} />
          </div>
          <div className="col-span-2 flex gap-3">
            <button
              type="submit"
              className="bg-green-700 hover:bg-green-600 text-white px-5 py-2 rounded transition-colors text-sm font-medium"
            >
              Save Changes
            </button>
          </div>
        </form>
      </section>

      {/* Inventory */}
      <section className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">
          Inventory ({inventory.length} items)
        </h2>

        {inventory.length > 0 && (
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 pr-3 text-gray-400 font-medium">Type</th>
                <th className="text-left py-2 pr-3 text-gray-400 font-medium">Item ID</th>
                <th className="text-left py-2 pr-3 text-gray-400 font-medium">Rarity</th>
                <th className="text-left py-2 pr-3 text-gray-400 font-medium">Equipped</th>
                <th className="text-left py-2 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const itemId = String(item._id);
                async function handleToggle() {
                  'use server';
                  await toggleEquip(itemId);
                }
                async function handleDeleteItem() {
                  'use server';
                  await deleteItem(itemId);
                }
                return (
                  <tr key={itemId} className="border-b border-gray-800">
                    <td className="py-2 pr-3 text-gray-300">{item.itemType}</td>
                    <td className="py-2 pr-3 text-gray-300 font-mono text-xs">{item.itemId}</td>
                    <td className="py-2 pr-3">
                      <RarityBadge rarity={item.rarity} />
                    </td>
                    <td className="py-2 pr-3">
                      <form action={handleToggle}>
                        <button
                          type="submit"
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            item.equipped
                              ? 'bg-green-800 text-green-300 hover:bg-green-700'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          {item.equipped ? 'Equipped' : 'Unequipped'}
                        </button>
                      </form>
                    </td>
                    <td className="py-2">
                      <form action={handleDeleteItem}>
                        <button
                          type="submit"
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Add Item Form */}
        <div className="border-t border-gray-700 pt-4 mt-4">
          <p className="text-sm text-gray-400 mb-3">Add Item</p>
          <form action={handleAddItem} className="flex gap-2 flex-wrap">
            <input
              name="itemType"
              placeholder="Type (e.g. character)"
              required
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              name="itemId"
              placeholder="Item ID"
              required
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              name="rarity"
              placeholder="Rarity (common/rare/epic)"
              required
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded transition-colors text-sm"
            >
              Add
            </button>
          </form>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-gray-900 border border-red-900/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-gray-400 text-sm mb-4">
          Permanently delete this player, their user account, and all inventory.
          This cannot be undone.
        </p>
        <form action={handleDelete}>
          <button
            type="submit"
            className="bg-red-700 hover:bg-red-600 text-white px-5 py-2 rounded transition-colors text-sm font-medium"
          >
            Delete Player
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({
  name,
  label,
  type = 'text',
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue: string | number;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm text-gray-400 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
      />
    </div>
  );
}

function RarityBadge({ rarity }: { rarity: string }) {
  const colors: Record<string, string> = {
    common: 'text-gray-400 bg-gray-700',
    uncommon: 'text-green-400 bg-green-900/40',
    rare: 'text-blue-400 bg-blue-900/40',
    epic: 'text-purple-400 bg-purple-900/40',
    legendary: 'text-yellow-400 bg-yellow-900/40',
  };
  const cls = colors[rarity?.toLowerCase()] ?? 'text-gray-400 bg-gray-700';
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>
      {rarity}
    </span>
  );
}
