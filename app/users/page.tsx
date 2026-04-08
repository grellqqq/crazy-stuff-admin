import { requireAuth } from '@/lib/auth';
import { getDB } from '@/lib/db';

async function getUsers(search: string) {
  const db = await getDB();
  const filter = search
    ? {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
    : {};
  const users = await db
    .collection('users')
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return users;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const search = params.search ?? '';
  const users = await getUsers(search);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-yellow-400">Users</h1>
        <span className="text-gray-400 text-sm">{users.length} found</span>
      </div>

      <form method="GET" className="mb-4">
        <div className="flex gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by username or email..."
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-80"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors text-sm"
          >
            Search
          </button>
          {search && (
            <a
              href="/users"
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
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Google</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Password</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No users found
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr
                key={String(u._id)}
                className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-100 font-medium">
                  {u.username ?? <span className="text-gray-500 italic">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {u.email ?? <span className="text-gray-500 italic">—</span>}
                </td>
                <td className="px-4 py-3">
                  <StatusDot active={!!u.googleSub} label={u.googleSub ? 'Linked' : 'No'} />
                </td>
                <td className="px-4 py-3">
                  <StatusDot active={!!u.passwordHash} label={u.passwordHash ? 'Set' : 'No'} />
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${active ? 'text-green-400' : 'text-gray-500'}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400' : 'bg-gray-600'}`}
      />
      {label}
    </span>
  );
}
