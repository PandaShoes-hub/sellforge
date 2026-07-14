type ModulePageProps = {
  heading: string;
  eyebrow: string;
  description: string;
  icon: string;
  features: string[];
  primaryLabel: string;
};

export default function ModulePage({
  heading,
  eyebrow,
  description,
  icon,
  features,
  primaryLabel,
}: ModulePageProps) {
  return (
    <s-page heading={heading}>
      <s-button slot="primary-action" variant="primary" disabled>
        {primaryLabel}
      </s-button>

      <div className="lp-module-hero">
        <div className="lp-module-icon" aria-hidden="true">{icon}</div>
        <div>
          <p className="lp-eyebrow">{eyebrow}</p>
          <h2 className="lp-module-title">{heading}</h2>
          <p className="lp-module-description">{description}</p>
        </div>
      </div>

      <div className="lp-feature-grid">
        {features.map((feature, index) => (
          <div className="lp-feature-card" key={feature}>
            <span className="lp-feature-number">{String(index + 1).padStart(2, "0")}</span>
            <p>{feature}</p>
          </div>
        ))}
      </div>

      <div className="lp-coming-soon">
        <strong>Module prepared</strong>
        <span>This area is ready for the next development phase.</span>
      </div>
    </s-page>
  );
}
