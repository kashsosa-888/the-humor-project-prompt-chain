import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/tool/flavors");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-600/20 p-3">
            <svg className="h-8 w-8 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prompt Chain Tool</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Humor Project — Chain Manager</p>
        </div>

        {params.error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300">
            <p className="text-sm">Authentication failed. Please try again.</p>
          </div>
        )}

        <div className="flex justify-center">
          <GoogleSignInButton />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          Superadmin or Matrix Admin access required
        </p>
      </div>
    </div>
  );
}
