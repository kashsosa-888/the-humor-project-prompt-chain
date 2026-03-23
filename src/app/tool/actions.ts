"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

// ─── Auth helper ────────────────────────────────────────────────────────────

async function requireAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    throw new Error("Not authorized");
  }

  return { user, admin };
}

// ─── Humor Flavor Actions ────────────────────────────────────────────────────

export async function createHumorFlavor(formData: FormData) {
  try {
    const { admin } = await requireAccess();
    const slug = String(formData.get("slug") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!slug) return { error: "Slug is required" };

    const { error } = await admin.from("humor_flavors").insert({ slug, description: description || null });
    if (error) return { error: error.message };

    revalidatePath("/tool/flavors");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateHumorFlavor(id: string, formData: FormData) {
  try {
    const { admin } = await requireAccess();
    const slug = String(formData.get("slug") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!slug) return { error: "Slug is required" };

    const { error } = await admin
      .from("humor_flavors")
      .update({ slug, description: description || null })
      .eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/tool/flavors");
    revalidatePath(`/tool/flavors/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteHumorFlavor(id: string) {
  try {
    const { admin } = await requireAccess();
    const { error } = await admin.from("humor_flavors").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/tool/flavors");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ─── Humor Flavor Step Actions ───────────────────────────────────────────────

export async function createHumorFlavorStep(humorFlavorId: string, formData: FormData) {
  try {
    const { admin } = await requireAccess();

    // Get current max order_by for this flavor
    const { data: existing } = await admin
      .from("humor_flavor_steps")
      .select("order_by")
      .eq("humor_flavor_id", humorFlavorId)
      .order("order_by", { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? (existing[0].order_by ?? 0) + 1 : 1;

    const llmModelId = formData.get("llm_model_id");
    const llmTemperature = formData.get("llm_temperature");

    const { error } = await admin.from("humor_flavor_steps").insert({
      humor_flavor_id: humorFlavorId,
      order_by: nextOrder,
      description: String(formData.get("description") ?? "").trim() || null,
      llm_model_id: llmModelId ? String(llmModelId) : null,
      llm_temperature: llmTemperature ? parseFloat(String(llmTemperature)) : null,
      llm_system_prompt: String(formData.get("llm_system_prompt") ?? "").trim() || null,
      llm_user_prompt: String(formData.get("llm_user_prompt") ?? "").trim() || null,
    });

    if (error) return { error: error.message };

    revalidatePath(`/tool/flavors/${humorFlavorId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateHumorFlavorStep(stepId: string, humorFlavorId: string, formData: FormData) {
  try {
    const { admin } = await requireAccess();

    const llmModelId = formData.get("llm_model_id");
    const llmTemperature = formData.get("llm_temperature");

    const { error } = await admin
      .from("humor_flavor_steps")
      .update({
        description: String(formData.get("description") ?? "").trim() || null,
        llm_model_id: llmModelId ? String(llmModelId) : null,
        llm_temperature: llmTemperature ? parseFloat(String(llmTemperature)) : null,
        llm_system_prompt: String(formData.get("llm_system_prompt") ?? "").trim() || null,
        llm_user_prompt: String(formData.get("llm_user_prompt") ?? "").trim() || null,
      })
      .eq("id", stepId);

    if (error) return { error: error.message };

    revalidatePath(`/tool/flavors/${humorFlavorId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteHumorFlavorStep(stepId: string, humorFlavorId: string) {
  try {
    const { admin } = await requireAccess();
    const { error } = await admin.from("humor_flavor_steps").delete().eq("id", stepId);
    if (error) return { error: error.message };

    revalidatePath(`/tool/flavors/${humorFlavorId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function reorderHumorFlavorStep(
  stepId: string,
  humorFlavorId: string,
  direction: "up" | "down"
) {
  try {
    const { admin } = await requireAccess();

    // Fetch all steps for this flavor ordered
    const { data: steps, error: fetchError } = await admin
      .from("humor_flavor_steps")
      .select("id, order_by")
      .eq("humor_flavor_id", humorFlavorId)
      .order("order_by", { ascending: true });

    if (fetchError) return { error: fetchError.message };
    if (!steps || steps.length < 2) return { error: "Not enough steps to reorder" };

    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx === -1) return { error: "Step not found" };

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= steps.length) return { error: "Cannot move step in that direction" };

    const currentStep = steps[idx];
    const swapStep = steps[swapIdx];

    // Swap order_by values
    const { error: e1 } = await admin
      .from("humor_flavor_steps")
      .update({ order_by: swapStep.order_by })
      .eq("id", currentStep.id);

    const { error: e2 } = await admin
      .from("humor_flavor_steps")
      .update({ order_by: currentStep.order_by })
      .eq("id", swapStep.id);

    if (e1 || e2) return { error: e1?.message ?? e2?.message ?? "Reorder failed" };

    revalidatePath(`/tool/flavors/${humorFlavorId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
