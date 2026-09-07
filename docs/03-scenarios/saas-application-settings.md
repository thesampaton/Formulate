# SaaS application settings

[Scenario rubric](README.md) · [State and completion](../03-state-and-completion.md)

Profile and Notifications are pages presented as tabs. Each has a save action with an explicit scope; page boundaries do not automatically become save boundaries.

```text
library field Email
  value: email address
  validate: email format

library section Profile
  name = field at displayName
    control: Input
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
    when notifications.enabled.value:
      require profile.email.value == acknowledgedEmail
    payload: notifications
    handler: application.saveNotifications
```

Notifications declares its external recipient input; the form connects the particular email field. Its save validation reaches beyond its payload because the dependency does. This example requires enabled notifications to use the last application-acknowledged email, so an unsaved recipient prompts “save Profile first”. That is an explicit action policy.

A valid draft can be complete yet unsaved. The action's acknowledgement guard can still block saving. Successful SaveNotifications acknowledges only its payload, not other profile edits.

| Change | Required outcome |
| --- | --- |
| Move email or replace its control. | Preserve its binding, rules, and notification dependency. |
| Edit email without saving, then save enabled notifications. | Check the recipient and acknowledgement guard without silently saving Profile. An unrelated invalid display name need not block this action. |
| Switch tabs and unmount Profile. | Preserve the email draft and dependency; recheck completion and the save guard. |
| Receive a notification rejection after further edits. | Reconcile it with that save attempt and scope. Preserve newer and unrelated edits; do not reset the whole form or mark it saved. |

The application owns persisted settings, permissions, and concurrent-update decisions, including acknowledgement changes from outside this form.

**Later API question:** How should scoped actions expose “save first”, combined-save, or other policies for dependencies on unsaved values?
