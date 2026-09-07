# SaaS application settings

[Scenario rubric](README.md)

This Part 9 hero scenario tests pages shown as tabs and scoped saves, using illustrative notation rather than a published API.

A settings form has Profile and Notifications pages presented as tabs, each showing its corresponding section. Page and section boundaries do not automatically become save scopes; the actions declare those scopes explicitly. Tab labels and routes may change without changing logical page identity.

Notifications needs the profile email to determine availability. It declares that input; the form connects the particular instance. The reusable section does not guess an outside path such as `profile.email`.

```text
library field Email
  value: email address
  validate: email format

library section Profile
  name = field at displayName
    control: Input
    placeholder: Enter your name
    validate: required
  email = use Email at email

library section Notifications
  input: recipientEmail
  enabled = field at emailEnabled
    control: Switch
  rule: when enabled.value, recipientEmail must be usable

form ApplicationSettings
  input: acknowledgedEmail from application
  profile = use Profile at profile
  notifications = use Notifications at notifications
    recipientEmail <- profile.email.value

  pages:
    Profile: present profile; offer SaveProfile
    Notifications: present notifications; offer SaveNotifications
  presentation: tabs
  workflow: either page may be opened directly
  SaveProfile:
    validate: profile requirements and relevant dependencies
    payload: profile
    handler: application.saveProfile
  SaveNotifications:
    validate: notification requirements and recipient dependency
    when notifications.enabled.value: require profile.email.value == acknowledgedEmail
    payload: notifications
    handler: application.saveNotifications
```

Input and Switch are local shadcn controls configured inline, alongside reusable Email. Each inline declaration creates a field instance without a named definition or registry entry. Both styles share binding, state, and completion rules; later extraction into a library preserves identities, values, configuration, and behaviour.

These actions explicitly choose payload scopes. Their validation scopes can reach beyond those scopes when a declared rule depends on another value. Saving notifications must not silently submit unrelated profile edits, but it also cannot claim success based on an email that exists only in an unsaved draft.

For this rubric, an enabled notification save requires a valid email matching the application's last acknowledged profile email. Otherwise the action explains that Profile must be saved first. This is an example policy, not a universal default. The application supplies the acknowledgement and remains authoritative if persisted state changes concurrently.

**Completion and state:** fields expose current validation and completion; each section and page derives completion from its applicable members and requirements. The form reflects all applicable requirements. A valid draft can be complete yet unsaved; an unsaved-email guard can still block SaveNotifications. Touched fields, visited tabs, pending saves, and acknowledged payloads are separate state. Pages share the form's values and field state even when a tab unmounts.

| Proposed change | Invariant expectations |
| --- | --- |
| Move email into another visual panel and replace its default control. | The existing email instance keeps its identity, binding, rules, and notification dependency. A compatible renderer does not create a second field or change action scopes. |
| Edit email without saving Profile, then enable notifications and save them. | The notification action checks the declared cross-scope dependency and the acknowledged-email condition. It neither silently saves Profile nor relies on a draft-only recipient. An unrelated invalid display name does not automatically block notifications. |
| The server rejects a notification save while Profile contains other edits. | Associate the response with that save attempt and its affected scope. Preserve unrelated profile edits; do not mark them saved or reset the whole form. Later edits require response reconciliation rather than blind replacement. |
| Edit email, switch tabs so Profile unmounts, and save Notifications. | Retain the email draft and its field state; recheck dependent completion and the save guard. A complete Notifications tab proves neither that Profile was saved nor that the form is complete. A full document reload requires draft recovery and re-evaluation. |

Formulate coordinates drafts, relevant requirements, scoped actions, and error presentation. Application services own persisted settings, permission checks, and concurrent-update decisions. A successful scoped save acknowledges its payload, not every draft value currently visible on the page.

**Open design question:** How should action scopes expose dependencies on unsaved values and acknowledged application state, so authors can choose “save first”, combined save, or another explicit policy without duplicating coordination rules?
