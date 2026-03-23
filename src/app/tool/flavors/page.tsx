import { createAdminClient } from "@/utils/supabase/admin";
import Link from "next/link";
import { FlavorActions } from "./FlavorActions";

export default async function FlavorsPage() {
  const admin = createAdminClient();

  const { data: flavors, error } = await admin
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Humor Flavors</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {flavors?.length ?? 0} flavor{flavors?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateFlavorButton />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300 text-sm">
          {error.message}
        </div>
      )}

      {!flavors || flavors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <svg className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">No humor flavors yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Slug / Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {flavors.map((flavor) => (
                <tr key={flavor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/tool/flavors/${flavor.id}`}
                      className="font-semibold text-violet-600 dark:text-violet-400 hover:underline font-mono"
                    >
                      {flavor.slug}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {flavor.description ?? <span className="italic text-gray-400 dark:text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-500 whitespace-nowrap">
                    {flavor.created_datetime_utc
                      ? new Date(flavor.created_datetime_utc).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <FlavorActions flavor={flavor} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateFlavorButton() {
  return (
    <Link
      href="/tool/flavors/new"
      className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      New Flavor
    </Link>
  );
}
