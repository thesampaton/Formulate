import { FormTabs, FormTabPage } from "@/components/formulate/form-tabs";
import { FormActionFieldset } from "@/components/formulate/form-action-fieldset";
import { FormStepLayout } from "@/components/formulate/form-page-layouts";
import { FormReviewActions } from "@/components/formulate/form-page-actions";
import { ProfileSummary } from "@/components/formulate/profile-summary";
import { MultiPageProfile } from "@/declarations/multi-page-profile";
import { useProfilePages } from "@/hooks/use-profile-pages";
import { profileSections } from "@/hooks/profile-pages";
import type { ProfileFormProps } from "@/hooks/use-profile-pages";

export function MultiPageForm(props: ProfileFormProps) {
  const { form, navigation, navigateToPage, scopedAction, handleInvalid, handleSubmit, tabs, completeCount, reviewHeadingRef, saved, savedCurrent } = useProfilePages(props);
  return <MultiPageProfile.Form form={form} scopedAction={scopedAction} onInvalid={handleInvalid} onSubmit={handleSubmit}>
    <header>
      <h2>Create your profile</h2>
      <p className="text-sm text-muted-foreground">Move between tabs freely. Your answers stay with the form.</p>
    </header>
    <p role="status" className="text-sm text-primary">{completeCount} of 3 pages complete{savedCurrent ? " · Saved" : " · Not saved"}</p>
    <FormActionFieldset>
      <FormTabs pages={tabs} value={navigation.page} onValueChange={navigation.goToPage} onNavigate={navigateToPage}
        label="Profile pages" pageLayout={FormStepLayout}>
        <FormTabPage value="profile" title="Your details">
          <profileSections.name.Section title="Your name" />
          <MultiPageProfile.Field name="email" />
        </FormTabPage>
        <FormTabPage value="delivery" title="Delivery details">
          <profileSections.address.Section title="Delivery address" />
        </FormTabPage>
        <FormTabPage value="notifications" title="How we contact you">
          <profileSections.notifications.Section />
        </FormTabPage>
        <FormTabPage value="review" title="Review your profile"
          actions={<FormReviewActions pendingLabel="Saving…">Save profile</FormReviewActions>}>
          <div ref={reviewHeadingRef} tabIndex={-1} role="group" aria-label="Profile summary" className="review-summary">
            <p>{completeCount === 3 ? "Your details are ready to save." : "Some pages still need information. Saving will take you to the first field to fix."}</p>
            <ProfileSummary values={form.getValues()} />
          </div>
          {saved ? <p className="text-sm text-primary">{savedCurrent ? "Profile saved." : "You have changes since the last save."}</p> : null}
        </FormTabPage>
      </FormTabs>
    </FormActionFieldset>
  </MultiPageProfile.Form>;
}
