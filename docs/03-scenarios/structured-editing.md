# Structured editing and compound pickers

The **Structured pickers** example uses locally installed shadcn Calendar, Popover, Button, Checkbox and Label. Formulate provides the value/focus/blur contract and an optional source-installed adapter item; it does not package shadcn UI. The form declares a nullable date range object and an array of activity codes. The schema validates partial ranges and formats dates only on submission.

Acceptance sequence:

1. Save empty values. Focus reaches the date-range trigger, with its visible label, help and first nested validation error.
2. Open Activities with Enter. Tab among labelled checkboxes without touching/validating the field. Space toggles a value; Escape/Done closes, validates and restores trigger focus.
3. Open the calendar, clear the range, select dates, and close. Partial/empty values remain editable; nested schema errors appear at the registered root. Save supplies date-only strings while RHF retains Date objects.
4. Hide editors with a popup open. No popup remains visible or keyboard-accessible, reopening the page keeps values and starts with closed popups. Reset while hidden still updates both editors.
5. Toggle the example's scoped dark theme. Popups inherit its variables because their destination is inside that theme. The normal unscoped adapter uses the primitive's default portal. A disabled form closes open pickers and disables triggers.
6. Inspect the page/section heading hierarchy and the source panels for field/body/heading styling slots, the complete adapters, and the single `globals.css` theme.

The [automated checks](../../tests/structured-editing.test.tsx) cover these bindings, transformations, reset, disabled state, Activity and accessible relationships. This is a bounded integration, not a cross-browser or screen-reader audit. Arbitrary structured controls still need an adapter that fulfils their particular keyboard/focus contract. Other shadcn backends and external CSS configurations remain future work.
