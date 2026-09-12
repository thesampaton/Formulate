import { useId } from "react";

/** A diagram of the existing multi-page profile composition, not an interactive form. */
export function FormAnatomy() {
  const id = useId();

  return (
    <svg
      className="form-anatomy"
      viewBox="0 0 1080 630"
      role="img"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <title id={`${id}-title`}>Anatomy of a composed Formulate form</title>
      <desc id={`${id}-description`}>
        One profile form contains navigation for Your details, Delivery, Notifications and Review.
        The active Your details page contains a reusable Name section, with first and last name
        fields arranged in a row, and a separate Email field. Each field has a label, a connected
        control, and optional help or error text. A Continue action checks the configured scope
        before navigation. The form owns the shared values across all pages; pages and layouts
        arrange their presentation without adding a level to the value paths.
      </desc>

      <g className="anatomy-drawing">
        <rect className="anatomy-form-shadow" x="211" y="45" width="590" height="548" rx="16" />
        <rect className="anatomy-form" x="205" y="38" width="590" height="548" rx="16" />
        <text className="anatomy-form-heading" x="234" y="82">Create your profile</text>
        <text className="anatomy-small anatomy-muted" x="234" y="107">Your answers stay with the form.</text>

        <rect className="anatomy-navigation" x="233" y="130" width="534" height="44" rx="8" />
        <rect className="anatomy-tab-active" x="237" y="134" width="138" height="36" rx="6" />
        <text className="anatomy-tab anatomy-tab-selected" x="306" y="157" textAnchor="middle">Your details</text>
        <text className="anatomy-tab" x="432" y="157" textAnchor="middle">Delivery</text>
        <text className="anatomy-tab" x="569" y="157" textAnchor="middle">Notifications</text>
        <text className="anatomy-tab" x="707" y="157" textAnchor="middle">Review</text>

        <rect className="anatomy-page" x="225" y="194" width="550" height="368" rx="10" />
        <text className="anatomy-page-heading" x="250" y="226">Your details</text>
        <text className="anatomy-code anatomy-muted" x="749" y="225" textAnchor="end">page: profile</text>

        <rect className="anatomy-section" x="247" y="247" width="506" height="139" rx="8" />
        <text className="anatomy-section-heading" x="266" y="274">Your name</text>
        <text className="anatomy-code anatomy-muted" x="735" y="273" textAnchor="end">name</text>
        <rect className="anatomy-row" x="260" y="287" width="480" height="84" rx="5" />
        <text className="anatomy-field-label" x="269" y="308">First name</text>
        <text className="anatomy-field-label" x="511" y="308">Last name</text>
        <rect className="anatomy-input" x="268" y="320" width="221" height="40" rx="5" />
        <rect className="anatomy-input" x="510" y="320" width="221" height="40" rx="5" />
        <text className="anatomy-value" x="282" y="345">Alex</text>
        <text className="anatomy-value" x="524" y="345">Morgan</text>

        <rect className="anatomy-field-outline" x="247" y="402" width="506" height="100" rx="8" />
        <text className="anatomy-field-label" x="267" y="425">Email</text>
        <rect className="anatomy-input" x="266" y="436" width="466" height="36" rx="5" />
        <text className="anatomy-value" x="280" y="459">alex@example.com</text>
        <text className="anatomy-help" x="267" y="491">Use an address you can access.</text>

        <text className="anatomy-small anatomy-muted" x="250" y="539">Page 1 of 4</text>
        <rect className="anatomy-action" x="626" y="515" width="125" height="33" rx="6" />
        <text className="anatomy-action-label" x="679" y="536" textAnchor="middle">Continue</text>
        <path className="anatomy-action-arrow" d="M716 531h12m-4-4 4 4-4 4" />
      </g>

      <g className="anatomy-callouts" aria-hidden="true">
        <path d="M86 73H205" /><circle cx="205" cy="73" r="3" />
        <text className="anatomy-callout-label" x="27" y="78">Form</text>
        <text className="anatomy-callout-detail" x="27" y="102">One set of values</text>

        <path d="M767 152h85" /><circle cx="767" cy="152" r="3" />
        <text className="anatomy-callout-label" x="867" y="150">Navigation</text>
        <text className="anatomy-callout-detail" x="867" y="172">Choose a page</text>

        <path d="M89 212H225" /><circle cx="225" cy="212" r="3" />
        <text className="anatomy-callout-label" x="27" y="217">Page</text>
        <text className="anatomy-callout-detail" x="27" y="241">A view of the form</text>

        <path d="M108 271h139" /><circle cx="247" cy="271" r="3" />
        <text className="anatomy-callout-label" x="27" y="276">Section</text>
        <text className="anatomy-callout-detail" x="27" y="300">A reusable group</text>

        <path d="M113 365h66v-31h81" /><circle cx="260" cy="334" r="3" />
        <text className="anatomy-callout-label" x="27" y="370">Layout</text>
        <text className="anatomy-callout-detail" x="27" y="394">Arrange the fields</text>

        <path d="M581 303h271" /><circle cx="581" cy="303" r="3" />
        <text className="anatomy-callout-label" x="867" y="307">Label</text>

        <path d="M731 340h121" /><circle cx="731" cy="340" r="3" />
        <text className="anatomy-callout-label" x="867" y="345">Control</text>
        <text className="anatomy-callout-detail" x="867" y="367">Your shadcn component</text>

        <path d="M89 447h158" /><circle cx="247" cy="447" r="3" />
        <text className="anatomy-callout-label" x="27" y="452">Field</text>
        <text className="anatomy-callout-detail" x="27" y="476">A value and its editor</text>

        <path d="M472 487h339v-26h41" /><circle cx="472" cy="487" r="3" />
        <text className="anatomy-callout-label" x="867" y="464">Help text</text>
        <text className="anatomy-callout-detail" x="867" y="486">Description or error</text>

        <path d="M751 532h101" /><circle cx="751" cy="532" r="3" />
        <text className="anatomy-callout-label" x="867" y="537">Action</text>
        <text className="anatomy-callout-detail" x="867" y="559">Continue or submit</text>
      </g>
    </svg>
  );
}
