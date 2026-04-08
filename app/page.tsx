import { requireAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';

async function getStats() {
  const db = await getDB();
  const [totalPlayers, totalItems, recentUsers, levelAgg, coinsAgg] =
    await Promise.all([
      db.collection('players').countDocuments(),
      db.collection('inventory').countDocuments(),
      db
        .collection('users')
        .find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),
      db
        .collection('players')
        .aggregate([
          { $group: { _id: null, avgLevel: { $avg: '$level' } } },
        ])
        .toArray(),
      db
        .collection('players')
        .aggregate([
          { $group: { _id: null, totalCoins: { $sum: '$coins' } } },
        ])
        .toArray(),
    ]);

  const avgLevel = levelAgg[0]?.avgLevel ?? 0;
  const totalCoins = coinsAgg[0]?.totalCoins ?? 0;

  return { totalPlayers, totalItems, recentUsers, avgLevel, totalCoins };
}

export default async function DashboardPage() {
  await requireAuth();
  const stats = await getStats();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Players" value={stats.totalPlayers} />
        <StatCard label="Items in Circulation" value={stats.totalItems} />
        <StatCard
          label="Avg Level"
          value={stats.avgLevel.toFixed(1)}
          numeric={false}
        />
        <StatCard
          label="Total Coins"
          value={stats.totalCoins.toLocaleString()}
          numeric={false}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-200 mb-3">
          Recent Registrations
        </h2>
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">
                  Username
                </th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-6 text-gray-500 text-sm"
                  >
                    No users yet
                  </td>
                </tr>
              )}
              {stats.recentUsers.map((u) => (
                <tr
                  key={String(u._id)}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-100">
                    {u.username ?? (
                      <span className="text-gray-500 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {u.email ?? (
                      <span className="text-gray-500 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickLink
          href="/players"
          label="Manage Players"
          desc="View, edit, and delete merged player accounts"
        />
        <QuickLink
          href="/items"
          label="Browse Items"
          desc="All inventory items across all players"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  numeric = true,
}: {
  label: string;
  value: number | string;
  numeric?: boolean;
}) {
  const display =
    numeric && typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-gray-100 mt-1">{display}</p>
    </div>
  );
}

function QuickLink({
  href,
  label,
  desc,
}: {
  href: string;
  label: string;
  desc: string;
}) {
  return (
    <a
      href={href}
      className="bg-gray-800 border border-gray-700 rounded-lg p-5 hover:border-blue-600 transition-colors group"
    >
      <p className="text-blue-400 font-semibold group-hover:text-blue-300">
        {label}
      </p>
      <p className="text-gray-400 text-sm mt-1">{desc}</p>
    </a>
  );
}
