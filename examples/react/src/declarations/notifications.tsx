import { z } from "zod";
import { Section } from "@/lib/formulate";
import type { SectionPresentationProps } from "@/lib/formulate";
import { defineSection } from "@/lib/formulate-config";
import { Stack } from "@/components/formulate/layouts";

export const Notifications = defineSection({
  channel: {
    schema: z.string().pipe(z.enum(["email", "sms"], { error: "Choose a notification method." })),
    defaultValue: "", label: "Notification method", component: "select",
    componentProps: { placeholder: "Choose a method", options: [{ value: "email", label: "Email" }, { value: "sms", label: "SMS" }] },
  },
  phone: {
    schema: z.string().trim(), defaultValue: "", label: "Mobile number", component: "input",
    description: "Demo format: + followed by 8 to 15 digits.", componentProps: { type: "tel", autoComplete: "tel", placeholder: "+61412345678" },
  },
}, {
  title: "Notifications", layout: Stack, render: NotificationFields,
  schema: (schema) => schema.superRefine(({ channel, phone }, context) => {
    if (channel === "sms" && !/^\+[1-9]\d{7,14}$/.test(phone)) {
      context.addIssue({ code: "custom", path: ["phone"], message: "Enter a mobile number for SMS, starting with +." });
    }
  }),
});

function NotificationFields({ title, layout }: SectionPresentationProps) {
  const channel = Notifications.useWatch("channel");
  const trigger = Notifications.useTrigger();
  return <Section title={title} layout={layout}>
    <Notifications.Field name="channel" componentProps={{ onValueChange: () => { void trigger("phone"); } }} />
    {channel === "sms" ? <Notifications.Field name="phone" /> :
      <p className="text-sm text-muted-foreground">Email notifications use the address on your Profile tab. Any mobile number you entered is kept if you switch back to SMS.</p>}
  </Section>;
}
