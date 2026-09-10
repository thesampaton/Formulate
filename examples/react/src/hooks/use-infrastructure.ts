import { useCallback, useEffect, useRef, useState } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { useFormNavigation } from "@formulate/react";
import { draftSchema, infrastructureSchema } from "@/declarations/infrastructure";
import type { DraftAdapter, InfrastructurePayload, InfrastructureValues } from "@/declarations/infrastructure";
import type { ChoiceLoader } from "@/lib/choice-request";
import { useChoiceForm } from "./use-choice-form";

export type InfrastructureProps = {
  accountId: string;
  defaultValues?: InfrastructureValues;
  listMachineSizes: ChoiceLoader;
  drafts: DraftAdapter;
  previewPlan: (values: InfrastructurePayload, accountId: string) => Promise<{ reference: string }>;
  onProvision: (request: { configuration: InfrastructurePayload; accountId: string; plan: string }) => Promise<void> | void;
};
const empty: InfrastructureValues = { regionId: "", resources: [] };

export function useInfrastructure({ accountId, defaultValues = empty, listMachineSizes, drafts, previewPlan, onProvision }: InfrastructureProps) {
  const sizeFields = useCallback((values: InfrastructureValues) => values.resources.map((item, index) => ({
    id: item.resourceId, name: `resources.${index}.machineSize` as const,
    input: values.regionId ? JSON.stringify([accountId, values.regionId]) : "",
  })), [accountId]);
  const { form, choices, getValidationRevision } = useChoiceForm({
    schema: infrastructureSchema, defaultValues, loader: listMachineSizes, fields: sizeFields,
  });
  const array = useFieldArray({ control: form.control, name: "resources" });
  const values = useWatch({ control: form.control });
  const navigation = useFormNavigation<InfrastructureValues, "configure" | "review">({ form, initialPage: "configure", destinations: [] });
  const [feedback, setFeedback] = useState("");
  const [saved, setSaved] = useState<string>();
  const [draftPending, setDraftPending] = useState(false);
  const [plan, setPlan] = useState<{ reference: string; current: () => boolean }>();
  const collection = useRef<HTMLDivElement>(null);
  const review = useRef<HTMLDivElement>(null);
  const lifetime = useRef<object | undefined>(undefined);
  const editEpoch = useRef(0);
  const draftBusy = useRef(false);

  useEffect(() => {
    lifetime.current = {};
    let key = JSON.stringify(form.getValues());
    const unsubscribe = form.subscribe({ formState: { values: true }, callback: () => {
      const next = JSON.stringify(form.getValues());
      if (next !== key) { editEpoch.current++; key = next; }
    } });
    return () => { lifetime.current = undefined; unsubscribe(); };
  }, [form, accountId, choices]);

  const setPage = (page: "configure" | "review") => navigation.goTo(page, () => (page === "review" ? review : collection).current?.focus());
  const correctResource = (id: string, member: "name" | "machineSize") => navigation.goTo("configure", () => {
    const index = form.getValues("resources").findIndex((item) => item.resourceId === id);
    if (index < 0) collection.current?.focus();
    else form.setFocus(`resources.${index}.${member}`);
  });
  function correct(errors: FieldErrors<InfrastructureValues>) {
    if (errors.regionId) { navigation.goTo("configure", () => form.setFocus("regionId")); return; }
    const index = form.getValues("resources").findIndex((_, index) => errors.resources?.[index]);
    if (index >= 0) correctResource(form.getValues(`resources.${index}.resourceId`), errors.resources?.[index]?.name ? "name" : "machineSize");
    else { setFeedback(errors.resources?.root?.message ?? errors.resources?.message ?? "Review the resource requirements."); setPage("configure"); }
  }
  async function draft(action: "save" | "restore") {
    if (draftBusy.current) return;
    draftBusy.current = true; setDraftPending(true);
    const owner = lifetime.current;
    const epoch = editEpoch.current;
    try {
      if (action === "save") {
        const snapshot = structuredClone(form.getValues());
        await drafts.save({ definition: "infrastructure-request", version: 1, revision: crypto.randomUUID(), values: snapshot });
        if (owner === lifetime.current) { setSaved(JSON.stringify(snapshot)); setFeedback("Draft saved."); }
      } else {
        const loaded = await drafts.load();
        if (owner !== lifetime.current) return;
        if (epoch !== editEpoch.current) { setFeedback("The draft arrived after you edited. Your current work was kept; load again to restore it."); return; }
        const parsed = draftSchema.safeParse(loaded);
        if (!parsed.success) { setFeedback("This draft is unavailable or incompatible. Your current work was kept."); return; }
        // Even an identical restore starts a new evidence lifetime.
        editEpoch.current++;
        choices.clear(); setPlan(undefined); setPage("configure"); form.reset(parsed.data.values);
        setSaved(JSON.stringify(parsed.data.values)); setFeedback("Draft restored. Available choices and requirements are being checked again.");
      }
    } catch {
      if (owner === lifetime.current) setFeedback(action === "save" ? "Unable to save this draft. Your edits are retained." : "Unable to load the draft. Your current work was kept.");
    } finally { draftBusy.current = false; if (lifetime.current) setDraftPending(false); }
  }
  async function submit(configuration: InfrastructurePayload) {
    if (navigation.page === "review") {
      if (!plan?.current()) { setFeedback("Preview a current plan before provisioning."); return; }
      await onProvision({ accountId, configuration, plan: plan.reference });
      return;
    }
    const owner = lifetime.current;
    const epoch = editEpoch.current;
    const revision = getValidationRevision();
    const current = () => owner === lifetime.current && epoch === editEpoch.current && revision === getValidationRevision();
    try {
      const result = await previewPlan(configuration, accountId);
      if (current()) { setPlan({ reference: result.reference, current }); setPage("review"); setFeedback("Plan ready for this configuration."); }
      else if (owner === lifetime.current) setFeedback("The configuration changed. Preview a new plan.");
    } catch { if (owner === lifetime.current) setFeedback("Unable to preview the plan. Try again."); }
  }
  return { form, array, values, choices, page: navigation.page, setPage, feedback, savedCurrent: saved === JSON.stringify(form.getValues()),
    draftPending, planCurrent: !!plan?.current(), collection, review, correct, draft, submit, correctResource,
    getValidationRevision: () => `${getValidationRevision()}:${navigation.revision}:${editEpoch.current}` };
}
