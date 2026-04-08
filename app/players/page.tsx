import { requireAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';

async function getPlayers(search: string) {
  const db = await getDB();
  const filter = search
    ? { username: { $regex: search, $options: 'i' } }
    : {};
  const players = await db
    .collection('players')
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return players;
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const search = params.search ?? '';
  const players = await getPlayers(search);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-yellow-400">Players</h1>
        <span className="text-gray-400 text-sm">{players.length} found</span>
      </div>

      <form method="GET" className="mb-4">
        <div className="flex gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by username..."
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-72"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors text-sm"
          >
            Search
          </button>
          {search && (
            <a
              href="/players"
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded transition-colors text-sm"
            >
              Clear
            </a>
          )}
        </div>
      </form>

      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Username</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Level</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">XP</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Coins</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Races</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Wins</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Character</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No players found
                </td>
              </tr>
            )}
            {players.map((p) => (
              <tr
                key={String(p._id)}
                className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-100 font-medium">{p.username}</td>
                <td className="px-4 py-3 text-gray-300">{p.level ?? 1}</td>
                <td className="px-4 py-3 text-gray-300">{(p.xp ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-yellow-400">{(p.coins ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-300">{p.totalRaces ?? 0}</td>
                <td className="px-4 py-3 text-green-400">{p.totalWins ?? 0}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{p.equippedChar ?? '—'}</td>
                <td className="px-4 py-3">
                  <a
                    href={`/players/${String(p._id)}`}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    Edit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
