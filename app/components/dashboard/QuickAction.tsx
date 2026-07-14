type QuickActionProps = {
  title: string;
  description: string;
  icon: string;
  href: string;
  badge?: string;
};

export default function QuickAction({ title, description, icon, href, badge }: QuickActionProps) {
  return (
    <a className="lp-action-card" href={href}>
      <span className="lp-action-icon" aria-hidden="true">{icon}</span>
      <span className="lp-action-copy">
        <span className="lp-action-title">
          {title}
          {badge ? <span className="lp-badge">{badge}</span> : null}
        </span>
        <span className="lp-muted">{description}</span>
      </span>
      <span className="lp-arrow" aria-hidden="true">→</span>
    </a>
  );
}
