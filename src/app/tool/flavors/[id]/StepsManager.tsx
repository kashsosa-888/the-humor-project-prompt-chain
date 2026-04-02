"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createHumorFlavorStep,
  updateHumorFlavorStep,
  deleteHumorFlavorStep,
  reorderHumorFlavorStep,
} from "../../actions";

interface Step {
  id: string;
  order_by: number | null;
  description: string | null;
  llm_model_id: string | null;
  llm_temperature: number | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  humor_flavor_id: string;
  humor_flavor_step_type_id: number | null;
  llm_input_type_id: number | null;
  llm_output_type_id: number | null;
}

interface Model {
  id: string;
  name: string;
}

interface Lookup {
  id: number;
  slug: string;
  description: string;
}

interface Flavor {
  id: string;
  slug: string;
  description: string | null;
}

interface StepFormProps {
  step?: Step;
  models: Model[];
  stepTypes: Lookup[];
  inputTypes: Lookup[];
  outputTypes: Lookup[];
  flavorId: string;
  onClose: () => void;
}

function StepForm({ step, models, stepTypes, inputTypes, outputTypes, flavorId, onClose }: StepFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = step
      ? await updateHumorFlavorStep(step.id, flavorId, formData)
      : await createHumorFlavorStep(flavorId, formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="my-4 w-full max-w-2xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {step ? "Edit Step" : "New Step"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input
              name="description"
              defaultValue={step?.description ?? ""}
              placeholder="Brief description of what this step does"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Step Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Step Type</label>
            <select
              name="humor_flavor_step_type_id"
              defaultValue={step?.humor_flavor_step_type_id ?? ""}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">— Select step type —</option>
              {stepTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.slug} — {t.description}</option>
              ))}
            </select>
          </div>

          {/* Input / Output Types */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input Type</label>
              <select
                name="llm_input_type_id"
                defaultValue={step?.llm_input_type_id ?? ""}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">— Select input type —</option>
                {inputTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.description}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Output Type</label>
              <select
                name="llm_output_type_id"
                defaultValue={step?.llm_output_type_id ?? ""}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">— Select output type —</option>
                {outputTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.description}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LLM Model</label>
              <select
                name="llm_model_id"
                defaultValue={step?.llm_model_id ?? ""}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">— Select model —</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Temperature <span className="text-gray-400 dark:text-gray-500 font-normal">(0–2)</span>
              </label>
              <input
                name="llm_temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                defaultValue={step?.llm_temperature ?? ""}
                placeholder="0.7"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System Prompt</label>
            <textarea
              name="llm_system_prompt"
              defaultValue={step?.llm_system_prompt ?? ""}
              rows={4}
              placeholder="You are a helpful assistant that…"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Prompt</label>
            <textarea
              name="llm_user_prompt"
              defaultValue={step?.llm_user_prompt ?? ""}
              rows={4}
              placeholder="Describe the image and list 5 funny captions…"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y font-mono text-xs"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : step ? "Update Step" : "Add Step"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StepsManager({
  flavor,
  initialSteps,
  models,
  stepTypes,
  inputTypes,
  outputTypes,
}: {
  flavor: Flavor;
  initialSteps: Step[];
  models: Model[];
  stepTypes: Lookup[];
  inputTypes: Lookup[];
  outputTypes: Lookup[];
}) {
  const router = useRouter();
  const [showNewStep, setShowNewStep] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [, startTransition] = useTransition();
  const [reordering, setReordering] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const modelMap = Object.fromEntries(models.map((m) => [m.id, m.name]));
  const stepTypeMap = Object.fromEntries(stepTypes.map((t) => [t.id, t.slug]));
  const inputTypeMap = Object.fromEntries(inputTypes.map((t) => [t.id, t.description]));
  const outputTypeMap = Object.fromEntries(outputTypes.map((t) => [t.id, t.description]));

  async function handleDelete(step: Step) {
    if (!confirm(`Delete step ${step.order_by}? This cannot be undone.`)) return;
    const result = await deleteHumorFlavorStep(step.id, flavor.id);
    if (result.error) {
      setStepError(result.error);
    } else {
      startTransition(() => router.refresh());
    }
  }

  async function handleReorder(step: Step, direction: "up" | "down") {
    setReordering(step.id);
    setStepError(null);
    const result = await reorderHumorFlavorStep(step.id, flavor.id, direction);
    if (result.error) {
      setStepError(result.error);
    } else {
      startTransition(() => router.refresh());
    }
    setReordering(null);
  }

  return (
    <div>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Steps
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {initialSteps.length} step{initialSteps.length !== 1 ? "s" : ""} — executed in order
          </p>
        </div>
        <button
          onClick={() => setShowNewStep(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Step
        </button>
      </div>

      {stepError && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
          {stepError}
        </div>
      )}

      {initialSteps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No steps yet. Add a step to define how this flavor generates captions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {initialSteps.map((step, idx) => (
            <div
              key={step.id}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
            >
              <div className="flex items-start gap-4">
                {/* Step number + reorder buttons */}
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40 text-xs font-bold text-violet-700 dark:text-violet-300">
                    {step.order_by ?? idx + 1}
                  </span>
                  <button
                    onClick={() => handleReorder(step, "up")}
                    disabled={idx === 0 || reordering === step.id}
                    title="Move up"
                    className="rounded p-0.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleReorder(step, "down")}
                    disabled={idx === initialSteps.length - 1 || reordering === step.id}
                    title="Move down"
                    className="rounded p-0.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  {step.description && (
                    <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">{step.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-2">
                    {step.humor_flavor_step_type_id != null && (
                      <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300 ring-1 ring-inset ring-purple-600/20 dark:ring-purple-400/20">
                        {stepTypeMap[step.humor_flavor_step_type_id] ?? `type:${step.humor_flavor_step_type_id}`}
                      </span>
                    )}
                    {step.llm_input_type_id != null && (
                      <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20 dark:ring-green-400/20">
                        in: {inputTypeMap[step.llm_input_type_id] ?? step.llm_input_type_id}
                      </span>
                    )}
                    {step.llm_output_type_id != null && (
                      <span className="inline-flex items-center rounded-md bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300 ring-1 ring-inset ring-orange-600/20 dark:ring-orange-400/20">
                        out: {outputTypeMap[step.llm_output_type_id] ?? step.llm_output_type_id}
                      </span>
                    )}
                    {step.llm_model_id && (
                      <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-400/20">
                        {modelMap[step.llm_model_id] ?? step.llm_model_id}
                      </span>
                    )}
                    {step.llm_temperature != null && (
                      <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        temp: {step.llm_temperature}
                      </span>
                    )}
                  </div>

                  {step.llm_system_prompt && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">System Prompt</p>
                      <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 whitespace-pre-wrap break-words font-mono max-h-32 overflow-y-auto">
                        {step.llm_system_prompt}
                      </pre>
                    </div>
                  )}

                  {step.llm_user_prompt && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">User Prompt</p>
                      <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 whitespace-pre-wrap break-words font-mono max-h-32 overflow-y-auto">
                        {step.llm_user_prompt}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditingStep(step)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(step)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showNewStep && (
        <StepForm
          flavorId={flavor.id}
          models={models}
          stepTypes={stepTypes}
          inputTypes={inputTypes}
          outputTypes={outputTypes}
          onClose={() => setShowNewStep(false)}
        />
      )}
      {editingStep && (
        <StepForm
          step={editingStep}
          flavorId={flavor.id}
          models={models}
          stepTypes={stepTypes}
          inputTypes={inputTypes}
          outputTypes={outputTypes}
          onClose={() => setEditingStep(null)}
        />
      )}
    </div>
  );
}
