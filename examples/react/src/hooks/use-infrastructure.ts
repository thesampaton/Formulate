import { useCallback, useEffect, useRef, useState } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { useChoiceForm, useFormNavigation } from "@formulate/react";
import type { ChoiceLoader } from "@formulate/react";
import { bindResource, draftSchema, infrastructureSchema } from "@/declarations/infrastructure";
import type { DraftAdapter, InfrastructurePayload, InfrastructureValues } from "@/declarations/infrastructure";

export type InfrastructureProps = {
  accountId: string;
  defaultValues?: InfrastructureValues;
  listMachineSizes: ChoiceLoader;
  drafts: DraftAdapter;
  previewPlan: (values: InfrastructurePayload, accountId: string) => Promise<{ reference: string }>;
  onProvision: (request: { configuration: InfrastructurePayload; accountId: string; plan: string }) => Promise<void> | void;
};
const emptyInfrastructureValues: InfrastructureValues = { regionId: "", resources: [] };

export function useInfrastructure({ accountId, defaultValues = emptyInfrastructureValues, listMachineSizes, drafts, previewPlan, onProvision }: InfrastructureProps) {
  const getChoiceBindings = useCallback((values: InfrastructureValues) => {
    return values.resources.flatMap((resource, index) => bindResource(resource.resourceId, index).bindChoices({
      values,
      services: { accountId, regionId: values.regionId, listMachineSizes },
    }));
  }, [accountId, listMachineSizes]);
  const form = useChoiceForm({ schema: infrastructureSchema, defaultValues, getChoiceBindings });
  const { choices, getValidationRevision } = form;
  const resourceArray = useFieldArray({ control: form.control, name: "resources" });
  const values = useWatch({ control: form.control });
  const navigation = useFormNavigation<InfrastructureValues, "configure" | "review">({
    form,
    initialPage: "configure",
    destinations: [],
  });
  const [feedback, setFeedback] = useState("");
  const [savedDraftSnapshot, setSavedDraftSnapshot] = useState<string>();
  const [draftPending, setDraftPending] = useState(false);
  const [plan, setPlan] = useState<{ reference: string; isCurrent: () => boolean }>();
  const resourceListRef = useRef<HTMLDivElement>(null);
  const reviewHeadingRef = useRef<HTMLDivElement>(null);
  const actionContextRef = useRef<object | undefined>(undefined);
  const editGenerationRef = useRef(0);
  const isDraftActionPendingRef = useRef(false);

  useEffect(() => {
    actionContextRef.current = {};
    let previousValuesSnapshot = JSON.stringify(form.getValues());
    const unsubscribe = form.subscribe({
      formState: { values: true },
      callback: () => {
        const valuesSnapshot = JSON.stringify(form.getValues());
        if (valuesSnapshot !== previousValuesSnapshot) {
          editGenerationRef.current++;
          previousValuesSnapshot = valuesSnapshot;
        }
      },
    });
    return () => {
      actionContextRef.current = undefined;
      unsubscribe();
    };
  }, [form, accountId, listMachineSizes, choices]);

  function goToPage(page: "configure" | "review") {
    const headingRef = page === "review" ? reviewHeadingRef : resourceListRef;
    navigation.goToPage(page, () => headingRef.current?.focus());
  }

  function goToResourceField(resourceId: string, fieldName: "name" | "machineSize") {
    navigation.goToPage("configure", () => {
      const index = form.getValues("resources").findIndex((resource) => resource.resourceId === resourceId);
      if (index < 0) {
        resourceListRef.current?.focus();
        return;
      }
      form.setFocus(bindResource(resourceId, index).resolveFieldPath(fieldName));
    });
  }

  function handleInvalid(errors: FieldErrors<InfrastructureValues>) {
    if (errors.regionId) {
      navigation.goToPage("configure", () => form.setFocus("regionId"));
      return;
    }
    const resourceIndex = form.getValues("resources").findIndex((_, index) => errors.resources?.[index]);
    if (resourceIndex >= 0) {
      const resourceId = form.getValues(`resources.${resourceIndex}.resourceId`);
      const fieldName = errors.resources?.[resourceIndex]?.name ? "name" : "machineSize";
      goToResourceField(resourceId, fieldName);
      return;
    }
    setFeedback(errors.resources?.root?.message ?? errors.resources?.message ?? "Review the resource requirements.");
    goToPage("configure");
  }

  async function runDraftAction(action: "save" | "restore") {
    if (isDraftActionPendingRef.current) return;
    isDraftActionPendingRef.current = true;
    setDraftPending(true);
    const actionContext = actionContextRef.current;
    const startingEditGeneration = editGenerationRef.current;

    try {
      if (action === "save") {
        const snapshot = structuredClone(form.getValues());
        await drafts.save({ definition: "infrastructure-request", version: 1, revision: crypto.randomUUID(), values: snapshot });
        if (actionContext === actionContextRef.current) {
          setSavedDraftSnapshot(JSON.stringify(snapshot));
          setFeedback("Draft saved.");
        }
        return;
      }

      const loadedDraft = await drafts.load();
      if (actionContext !== actionContextRef.current) return;
      if (startingEditGeneration !== editGenerationRef.current) {
        setFeedback("The draft arrived after you edited. Your current work was kept; load again to restore it.");
        return;
      }
      const parsedDraft = draftSchema.safeParse(loadedDraft);
      if (!parsedDraft.success) {
        setFeedback("This draft is unavailable or incompatible. Your current work was kept.");
        return;
      }

      // Even an identical restore invalidates evidence from before the restore.
      editGenerationRef.current++;
      choices.clearRequests();
      setPlan(undefined);
      goToPage("configure");
      form.reset(parsedDraft.data.values);
      setSavedDraftSnapshot(JSON.stringify(parsedDraft.data.values));
      setFeedback("Draft restored. Available choices and requirements are being checked again.");
    } catch {
      if (actionContext === actionContextRef.current) {
        const message = action === "save"
          ? "Unable to save this draft. Your edits are retained."
          : "Unable to load the draft. Your current work was kept.";
        setFeedback(message);
      }
    } finally {
      isDraftActionPendingRef.current = false;
      if (actionContextRef.current) setDraftPending(false);
    }
  }

  const saveDraft = () => runDraftAction("save");
  const restoreDraft = () => runDraftAction("restore");

  async function previewOrProvision(configuration: InfrastructurePayload) {
    if (navigation.page === "review") {
      if (!plan?.isCurrent()) {
        setFeedback("Preview a current plan before provisioning.");
        return;
      }
      await onProvision({ accountId, configuration, plan: plan.reference });
      return;
    }

    const actionContext = actionContextRef.current;
    const startingEditGeneration = editGenerationRef.current;
    const startingValidationRevision = getValidationRevision();
    const isPlanCurrent = () => actionContext === actionContextRef.current
      && startingEditGeneration === editGenerationRef.current
      && startingValidationRevision === getValidationRevision();
    try {
      const result = await previewPlan(configuration, accountId);
      if (isPlanCurrent()) {
        setPlan({ reference: result.reference, isCurrent: isPlanCurrent });
        goToPage("review");
        setFeedback("Plan ready for this configuration.");
      } else if (actionContext === actionContextRef.current) {
        setFeedback("The configuration changed. Preview a new plan.");
      }
    } catch {
      if (actionContext === actionContextRef.current) setFeedback("Unable to preview the plan. Try again.");
    }
  }

  return {
    form,
    resourceArray,
    values,
    choices,
    page: navigation.page,
    goToPage,
    feedback,
    savedCurrent: savedDraftSnapshot === JSON.stringify(form.getValues()),
    draftPending,
    planCurrent: !!plan?.isCurrent(),
    resourceListRef,
    reviewHeadingRef,
    handleInvalid,
    saveDraft,
    restoreDraft,
    previewOrProvision,
    goToResourceField,
    getValidationRevision: () => `${getValidationRevision()}:${navigation.revision}:${editGenerationRef.current}`,
  };
}
