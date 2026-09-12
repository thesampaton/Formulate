import type { z } from "zod";
import { defineForm } from "@/lib/formulate-config";
import { FieldGroup } from "@/components/ui/field";
import { Name } from "./name";
import { Email } from "./email";

export const Profile = defineForm({ name: Name, email: Email }, { layout: FieldGroup });

export type ProfileValues = z.output<typeof Profile.schema>;
