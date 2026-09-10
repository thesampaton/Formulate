import { useCallback, useEffect, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { useFormNavigation } from "@formulate/react";
import { CloudDeployment } from "@/declarations/cloud-deployment";
import type { CloudPayload, CloudValues } from "@/declarations/cloud-deployment";
import { useChoiceForm } from "@formulate/react";
import type { ChoiceLoader } from "@formulate/react";

export type CloudPage = "targets" | "production" | "review";
export type CloudFormProps = {
  listRegions: ChoiceLoader;
  defaultValues?: CloudValues;
  onDeploy: (payload: CloudPayload) => void | Promise<void>;
};

export function useCloudDeployment({ listRegions, defaultValues }: CloudFormProps) {
  const fields = useCallback((values: CloudValues) => CloudDeployment.bindChoices({ values, services: { listRegions } }), [listRegions]);
  const { form, choices, getValidationRevision } = useChoiceForm({
    schema: CloudDeployment.schema, defaultValues: { ...CloudDeployment.defaultValues, ...defaultValues },
    fields,
  });
  const values = useWatch({ control: form.control });
  const [notice, setNotice] = useState("");
  const review = useRef<HTMLDivElement>(null);
  const targetsHeading = useRef<HTMLDivElement>(null);
  const navigation = useFormNavigation<CloudValues, CloudPage>({
    form, initialPage: "targets",
    destinations: [
      { name: "environment", page: "targets" },
      ...CloudDeployment.fieldNames.filter((name) => name.startsWith("primary.") || name.startsWith("recovery.")).map((name) => ({ name, page: "targets" as const })),
      { name: "production", page: "production" },
    ],
  });

  function goTo(requested: CloudPage) {
    setNotice("");
    const page = requested === "production" && form.getValues("environment") !== "production" ? "targets" : requested;
    navigation.goTo(page, page === "review" ? () => review.current?.focus() : page === "targets" ? () => targetsHeading.current?.focus() : () => form.setFocus("production"));
  }
  useEffect(() => {
    if (navigation.page === "production" && values.environment !== "production") {
      setNotice("Production is no longer required. Your draft is retained; continue from Targets.");
      navigation.goTo("targets", () => form.setFocus("environment"));
    } else if (values.environment === "production") setNotice("");
  }, [navigation.page, values.environment]);

  const step = navigation.page === "review" ? undefined : {
    id: navigation.revision,
    fields: navigation.page === "targets" ? ["environment", "primary", "recovery"] as const : ["production"] as const,
    onValid: () => goTo(navigation.page === "targets" && form.getValues("environment") === "production" ? "production" : "review"),
  };
  return { form, choices, getValidationRevision, values, navigation, goTo, notice, review, targetsHeading, step };
}
