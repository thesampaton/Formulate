import type { z } from "zod";
import { defineForm, field } from "@/lib/formulate-config";
import { FieldGroup } from "@/components/ui/field";
import { Email, Password } from "./common-fields";

export const SignIn = defineForm({
  email: field(Email, { componentProps: { autoComplete: "username", className: "h-11" } }),
  password: field(Password, { componentProps: { className: "h-11" } }),
}, { layout: FieldGroup });

export type SignInValues = z.output<typeof SignIn.schema>;
