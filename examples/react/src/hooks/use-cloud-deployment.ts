import { useEffect, useMemo, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { useFormNavigation } from "@formulate/react";
import { CloudDeployment, createCloudGraph } from "@/declarations/cloud-deployment";
import type { CloudPayload, CloudValues } from "@/declarations/cloud-deployment";
import type { ChoiceLoader } from "@formulate/react";

export type CloudPage = "targets" | "production" | "review";
export type CloudFormProps = {
  listRegions: ChoiceLoader;
  defaultValues?: CloudValues;
  onDeploy: (payload: CloudPayload) => void | Promise<void>;
};

export function useCloudDeployment({ listRegions, defaultValues }: CloudFormProps) {
  const portable = useMemo(() => createCloudGraph(listRegions), [listRegions]);
  const services = useMemo(() => ({ listRegions }), [listRegions]);
  const form = CloudDeployment.useForm({ services, defaultValues });
  const values = useWatch({ control: form.control });
  const productionApplicable = form.inspection.nodes.production?.applicable ?? false;
  const [notice, setNotice] = useState("");
  const reviewHeadingRef = useRef<HTMLDivElement>(null);
  const targetsHeadingRef = useRef<HTMLDivElement>(null);
  const primary = CloudDeployment.bindSection("primary");
  const recovery = CloudDeployment.bindSection("recovery");
  const targetScope = {
    errorPaths: ["environment", ...primary.errorPaths, ...recovery.errorPaths],
    focusPaths: ["environment", ...primary.focusPaths, ...recovery.focusPaths],
  } as const;
  const navigation = useFormNavigation<CloudValues, CloudPage>({
    form, initialPage: "targets",
    destinations: [
      { scope: targetScope, page: "targets" },
      { name: "production", page: "production" },
    ],
  });

  function goToPage(requestedPage: CloudPage) {
    setNotice("");
    const requiresProduction = form.graphRuntime.inspect().nodes.production?.applicable ?? false;
    const page = requestedPage === "production" && !requiresProduction ? "targets" : requestedPage;
    navigation.goToPage(page, () => {
      if (page === "review") {
        reviewHeadingRef.current?.focus();
      } else if (page === "targets") {
        targetsHeadingRef.current?.focus();
      } else {
        form.setFocus("production");
      }
    });
  }
  useEffect(() => {
    if (navigation.page === "production" && !productionApplicable) {
      setNotice("Production is no longer required. Your draft is retained; continue from Targets.");
      navigation.goToPage("targets", () => form.setFocus("environment"));
    } else if (productionApplicable) {
      setNotice("");
    }
  }, [navigation.page, productionApplicable]);

  const scopedAction = navigation.page === "review" ? undefined : {
    id: navigation.revision,
    ...(navigation.page === "targets" ? { scope: targetScope } : { errorPaths: ["production"] as const }),
    onValid: () => {
      const requiresProduction = navigation.page === "targets" && form.graphRuntime.inspect().nodes.production?.applicable;
      goToPage(requiresProduction ? "production" : "review");
    },
  };
  return { form, graph: portable.graph, values, productionApplicable, navigation, goToPage, notice, reviewHeadingRef, targetsHeadingRef, primary, recovery, scopedAction };
}
