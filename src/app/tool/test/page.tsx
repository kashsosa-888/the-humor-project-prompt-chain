import { createAdminClient } from "@/utils/supabase/admin";
import { TestClient } from "./TestClient";

export default async function TestPage() {
  const admin = createAdminClient();

  const [flavorsResult, imagesResult] = await Promise.all([
    admin.from("humor_flavors").select("id, slug, description").order("slug"),
    admin.from("images").select("id, url").order("created_at", { ascending: false }).limit(50),
  ]);

  const flavors = flavorsResult.data ?? [];
  const images = imagesResult.data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Image Set Testing</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Run a humor flavor against a curated set of images. All images are processed in parallel.
        </p>
      </div>

      <TestClient flavors={flavors} images={images} />
    </div>
  );
}
