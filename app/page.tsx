import { requireAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';

async function getStats() {
  const db = await getDB();
  const [totalUsers, totalPlayers, totalItems] = await Promise.all([
    db.collection('users').countDocuments(),
    db.collection('players').countDocuments(),
    db.collection('inventory').countDocuments(),
  ]);
  return { totalUsers, totalPlayers, totalItems };
}

export default async function DashboardPage() {
  await requireAuth();
  const stats = await getStats();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Total Players" value={stats.totalPlayers} />
        <StatCard label="Total Items" value={stats.totalItems} />
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickLink href="/players" label="Manage Players" desc="View, edit, and delete player accounts" />
        <QuickLink href="/users" label="Manage Users" desc="View registered users and auth details" />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-gray-100 mt-1">{value.toLocaleString()}</p>
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a
      href={href}
      className="bg-gray-800 border border-gray-700 rounded-lg p-5 hover:border-blue-600 transition-colors group"
    >
      <p className="text-blue-400 font-semibold group-hover:text-blue-300">{label}</p>
      <p className="text-gray-400 text-sm mt-1">{desc}</p>
    </a>
  );
}
