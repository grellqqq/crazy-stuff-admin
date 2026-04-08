import { loginAction } from '@/app/actions';

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  async function handleLogin(formData: FormData) {
    'use server';
    const password = formData.get('password') as string;
    await loginAction(password);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">Crazy Stuff</h1>
          <p className="text-gray-400 mt-1 text-sm">Admin Dashboard</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Sign In</h2>

          <form action={handleLogin} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm text-gray-400 mb-1"
              >
                Admin Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
