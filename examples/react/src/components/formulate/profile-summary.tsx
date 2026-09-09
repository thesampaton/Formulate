import type { MultiPageProfileValues } from "@/declarations/multi-page-profile";
import { AddressSummary } from "./address-summary";

export function ProfileSummary({ values }: { values: MultiPageProfileValues }) {
  return <dl className="[&>div]:flex-wrap [&>div]:gap-2 [&_dd]:m-0 [&_dd]:break-words">
    <div><dt>Name</dt><dd>{[values.name?.firstName, values.name?.lastName].filter(Boolean).join(" ") || "Not entered"}</dd></div>
    <div><dt>Email</dt><dd>{values.email || "Not entered"}</dd></div>
    <div><dt>Delivery</dt><dd>{values.address?.street ? <AddressSummary address={values.address} /> : "Not entered"}</dd></div>
    <div><dt>Notifications</dt><dd>{values.notifications?.channel === "sms" ? `SMS · ${values.notifications.phone || "Number needed"}` : values.notifications?.channel === "email" ? "Email" : "Not chosen"}</dd></div>
  </dl>;
}
