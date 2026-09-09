import type { z } from "zod";
import { defineForm } from "@/lib/formulate-config";
import { Stack } from "@/components/formulate/layouts";
import { Name } from "./name";
import { Email } from "./email";

export const Profile = defineForm({ name: Name, email: Email }, { layout: Stack });

export type ProfileValues = z.output<typeof Profile.schema>;
