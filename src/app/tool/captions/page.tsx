import { createAdminClient } from "@/utils/supabase/admin";
import { CaptionsClient } from "./CaptionsClient";

const PER_PAGE = 25;

export default async function CaptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; flavor_id?: string }>;
}) {
  const { page: pageStr, flavor_id } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);
  const offset = (page - 1) * PER_PAGE;

  const admin = createAdminClient();

  // Build query
  let query = admin
    .from("captions")
    .select(
      `id, content, created_datetime_utc, image_id,
       images(url),
       caption_requests(id, llm_prompt_chains(id))`,
      { count: "exact" }
    )
    .order("created_datetime_utc", { ascending: false })
    .range(offset, offset + PER_PAGE - 1);

  if (flavor_id) {
    // Filter by flavor via caption_requests -> llm_model_responses -> humor_flavor_id
    // Simpler: filter captions that have a caption_request linked to an llm_model_response for this flavor
    const { data: requestIds } = await admin
      .from("llm_model_responses")
      .select("caption_request_id")
      .eq("humor_flavor_id", flavor_id);
    const ids = [...new Set((requestIds ?? []).map((r) => r.caption_request_id).filter(Boolean))];
    if (ids.length === 0) {
      const { data: flavors } = await admin.from("humor_flavors").select("id, slug").order("slug");
      return (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Captions</h1>
          <CaptionsClient captions={[]} flavors={flavors ?? []} total={0} page={1} perPage={PER_PAGE} flavorId={flavor_id ?? ""} />
        </div>
      );
    }
    query = query.in("caption_requests.id", ids);
  }

  const [captionsResult, flavorsResult] = await Promise.all([
    query,
    admin.from("humor_flavors").select("id, slug").order("slug"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const captions = (captionsResult.data ?? []) as unknown as {
    id: string;
    content: string;
    created_datetime_utc: string | null;
    image_id: string | null;
    caption_requests: { id: string; llm_prompt_chains: { id: string } | null } | null;
    images: { url: string } | null;
  }[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Captions</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generated captions with prompt chain inspection
        </p>
      </div>

      <CaptionsClient
        captions={captions}
        flavors={flavorsResult.data ?? []}
        total={captionsResult.count ?? 0}
        page={page}
        perPage={PER_PAGE}
        flavorId={flavor_id ?? ""}
      />
    </div>
  );
}
