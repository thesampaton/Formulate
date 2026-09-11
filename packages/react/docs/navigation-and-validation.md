# Navigation and validation

Use this guide when your composed form needs Continue actions or error navigation. Keep one form runtime for all pages; `useFormNavigation` tracks the current page and moves focus. The `scopedAction` prop on `Form` decides what a submit button or Enter key checks before continuing. Your component connects those two decisions.

## Build a two-page form

This form checks the email before opening the message page. Send validates the whole form and awaits the supplied save function.

```tsx
import {
  defineForm,
  Form,
  Page,
  useFormActionStatus,
  useFormNavigation,
} from "@formulate/react";
import { z } from "zod";

const Contact = defineForm({
  email: {
    schema: z.email(),
    defaultValue: "",
    label: "Email",
    component: "input",
    componentProps: { type: "email" },
  },
  message: {
    schema: z.string().min(1, "Enter a message."),
    defaultValue: "",
    label: "Message",
    component: "input",
  },
});

type ContactValues = z.input<typeof Contact.schema>;
type ContactSubmission = z.output<typeof Contact.schema>;
type ContactPage = "contact" | "message";

function FormActions({
  isFirstPage,
  onBack,
}: {
  isFirstPage: boolean;
  onBack: () => void;
}) {
  const { isPending } = useFormActionStatus();
  return (
    <>
      {!isFirstPage && (
        <button type="button" disabled={isPending} onClick={onBack}>
          Back
        </button>
      )}
      <button type="submit" disabled={isPending}>
        {isPending ? "Please wait…" : isFirstPage ? "Next" : "Send"}
      </button>
    </>
  );
}

export function ContactForm({
  saveContact,
}: {
  saveContact: (values: ContactSubmission) => Promise<void>;
}) {
  const form = Contact.useForm({ shouldFocusError: false });
  const navigation = useFormNavigation<ContactValues, ContactPage>({
    form,
    initialPage: "contact",
    destinations: [
      { name: "email", page: "contact" },
      { name: "message", page: "message" },
    ],
  });
  const isFirstPage = navigation.page === "contact";

  return (
    <Form
      form={form}
      scopedAction={isFirstPage ? {
        id: navigation.revision,
        errorPaths: ["email"],
        onValid: () => { navigation.goToField("message"); },
      } : undefined}
      onInvalid={(errors) => {
        if (!navigation.goToFirstError(errors)) {
          form.setError("root.submit", {
            message: "Review the form errors before continuing.",
          });
        }
      }}
      onSubmit={async (values) => { await saveContact(values); }}
    >
      <Page pageId="contact" title="Contact details" active={isFirstPage}>
        <Contact.Field name="email" />
      </Page>
      <Page pageId="message" title="Your message" active={!isFirstPage}>
        <Contact.Field name="message" />
      </Page>
      <FormActions
        isFirstPage={isFirstPage}
        onBack={() => { navigation.goToField("email"); }}
      />
    </Form>
  );
}
```

`Page` preserves inactive editors' state and DOM using React Activity, which pauses their effects. Keep the form hook above those pages so its subscriptions remain active. Hidden or unmounted editors retain their values and remain subject to the form schema.

Your application decides when saving means completion, whether to reset the draft, and which pages users may visit. Opening a page never submits the form or marks it complete.

## Choose which errors block Next

While `scopedAction` is present, submitting checks its `errorPaths` and then calls `onValid`. Omitting it restores whole-form validation and the final `onSubmit` callback. An empty `errorPaths` list calls `onValid` without validating.

The resolver still evaluates the whole form schema during a scoped check. The scope selects which resulting errors block this action and which errors reach `onInvalid`. An object path includes its descendants. A cross-field rule follows the schema's execution rules; place its error on a path in the scope if it should block Next. Rules outside the scope are still checked on final submission.

`onValid` receives no values: passing one scope does not establish that the complete parsed result is valid. Final `onSubmit` receives the schema's parsed output, which may differ from the editing values. Parsing does not overwrite the draft.

A reusable `FormScope` separates the paths checked from the editors focused:

| Property | Purpose | Example |
| --- | --- | --- |
| `errorPaths` | Errors that block the action, including errors on an object itself. | `["address"]` |
| `focusPaths` | Concrete editors in the order they should receive focus. | `["address.street", "address.postcode"]` |

Pass it as `scopedAction.scope` and as a navigation destination's `scope`. A [bound section](./fields-and-sections.md) already supplies both lists. When `focusPaths` is omitted, navigation uses `errorPaths`.

## Bring the user to an error

`goToFirstError(errors)` searches destinations in their declared order, then each destination's focus paths. It returns `false` when no editor matches. The example uses that result to show form-level feedback. An error on a section object can block Next without belonging to any focusable editor, so provide fallback feedback for it.

A `true` return value means navigation and focus were requested; it does not guarantee that focus succeeded. `goToField(name)` has the same contract and returns `false` for an unmapped path. Both move to mapped editors without validating or clearing errors. Set `shouldFocusError: false` when using this coordination so RHF does not also try to focus after validation.

For a collapsed editor, add `reveal: () => setExpanded(true)` to its destination, using your component's state setter. That callback must synchronously arrange for the editor to mount in the same committed update as navigation. Focus runs once after that commit. Async loading, suspended rendering, and unavailable destinations need application handling; the hook does not wait or retry for readiness.

Use `goToPage(page)` when no editor should receive focus. Its optional second argument runs once after the destination commits, for example to focus a heading ref. `initialPage` only sets the initial location; navigate through the methods after mounting.

For schema-level errors that do not belong to a field, leave the Zod issue path empty. Reserve RHF's `root` namespace for application feedback; RHF clears it during submission. Form displays `root.submit.message` automatically.

## Show pending and failure feedback

Call `useFormActionStatus()` in a component inside Form, as `FormActions` does above. Its `isPending` covers both scoped checks and final submission, including the awaited callback. Return or await the save promise so pending state lasts until the work settles. RHF's `isSubmitting` alone does not cover scoped checks.

Form blocks overlapping attempts. If a check or callback throws, it displays “Unable to complete this action. Please try again.” Override that text with `actionErrorMessage`. The next attempt clears the previous `root.submit` message. Success UI and server field-error mapping belong to your application; RHF's `isSubmitSuccessful` does not establish that your business process is complete.

## Handle changes during asynchronous checks

Before invoking validation success or failure callbacks, Form checks whether the attempt still applies. Changes to values, resets, a changed action ID or scope, a replacement form runtime, and unmounting invalidate a pending check. Use `navigation.revision` as the action ID: it changes on every navigation, including a return to the same page. Change the ID yourself if another application rule changes what the action means.

Validation may also depend on external evidence. In that case, pass a synchronous `getValidationRevision` function to Form that reads the live source and returns a stable string or number. It must change whenever that evidence becomes obsolete, including a fresh request for the same input. Form compares the revision captured before validation with the live revision before invoking its callbacks.

[Choice-aware forms](./dependent-choices.md) install this getter automatically. If you override it to include other evidence, your getter must include the form's choice revision as well. Forms validated only against their editing values need no getter.

These guards suppress callbacks from obsolete checks; they do not stop a resolver or an application callback that has already started. A resolver can still finish and update RHF errors. Pending state ends when the operation settles. If requests must be cancelled or late errors reconciled, handle that in your application.

See the [advanced-options example](../../../examples/react/src/advanced-options.tsx) for disclosure, review edit links, and focus on a review summary.
