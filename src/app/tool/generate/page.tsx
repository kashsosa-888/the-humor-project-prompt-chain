import { createAdminClient } from "@/utils/supabase/admin";
import { GenerateCaptionsClient } from "./GenerateCaptionsClient";

export default async function GeneratePage() {
  const admin = createAdminClient();

  const { data: flavors } = await admin
    .from("humor_flavors")
    .select("id, slug, description")
    .order("slug");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Generate Captions</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload an image and run it through a humor flavor to generate captions.
        </p>
      </div>
      <GenerateCaptionsClient flavors={flavors ?? []} />
    </div>
  );
}
