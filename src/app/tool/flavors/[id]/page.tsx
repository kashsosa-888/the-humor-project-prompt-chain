import { createAdminClient } from "@/utils/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StepsManager } from "./StepsManager";

export default async function FlavorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [flavorResult, stepsResult, modelsResult] = await Promise.all([
    admin.from("humor_flavors").select("id, slug, description, created_datetime_utc").eq("id", id).single(),
    admin
      .from("humor_flavor_steps")
      .select("id, order_by, description, llm_model_id, llm_temperature, llm_system_prompt, llm_user_prompt, humor_flavor_id")
      .eq("humor_flavor_id", id)
      .order("order_by", { ascending: true }),
    admin.from("llm_models").select("id, name").order("name"),
  ]);

  if (flavorResult.error || !flavorResult.data) {
    notFound();
  }

  const flavor = flavorResult.data;
  const steps = stepsResult.data ?? [];
  const models = modelsResult.data ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/tool/flavors"
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{flavor.slug}</h1>
          {flavor.description && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{flavor.description}</p>
          )}
        </div>
      </div>

      {/* Steps manager (client component) */}
      <StepsManager
        flavor={flavor}
        initialSteps={steps}
        models={models}
      />
    </div>
  );
}
