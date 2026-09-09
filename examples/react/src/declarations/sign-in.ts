import { z } from "zod";
import { defineForm } from "@/lib/formulate-config";
import { Stack } from "@/components/formulate/layouts";
import { Email } from "./email";

export const SignIn = defineForm({
  email: {
    ...Email,
    componentProps: { ...Email.componentProps, autoComplete: "username", className: "h-11" },
  },
  password: {
    schema: z.string().min(1, "Enter your password."),
    defaultValue: "",
    label: "Password",
    component: "input",
    componentProps: { type: "password", autoComplete: "current-password", className: "h-11" },
  },
}, { layout: Stack });

export type SignInValues = z.output<typeof SignIn.schema>;
