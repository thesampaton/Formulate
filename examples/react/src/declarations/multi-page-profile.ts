import type { z } from "zod";
import { defineForm } from "@/lib/formulate-config";
import { Stack } from "@/components/formulate/layouts";
import { Address } from "./address";
import { Name } from "./name";
import { Email } from "./email";

import { Notifications } from "./notifications";

export const MultiPageProfile = defineForm({ name: Name, email: Email, address: Address, notifications: Notifications }, { layout: Stack });
export type MultiPageProfileValues = z.input<typeof MultiPageProfile.schema>;
export type MultiPageProfilePayload = z.output<typeof MultiPageProfile.schema>;
