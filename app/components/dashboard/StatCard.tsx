type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: string;
  trend?: string;
  positive?: boolean;
};

export default function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  positive = true,
}: StatCardProps) {
  return (
    <article className="lp-stat-card">
      <div className="lp-stat-card-top">
        <div className="lp-stat-icon" aria-hidden="true">
          {icon}
        </div>

        {trend ? (
          <span
            className={`lp-stat-badge ${
              positive ? "positive" : "negative"
            }`}
          >
            {trend}
          </span>
        ) : null}
      </div>

      <div className="lp-stat-content">
        <p className="lp-eyebrow">{label}</p>

        <h2 className="lp-stat-value">{value}</h2>

        <p className="lp-muted">{hint}</p>
      </div>
    </article>
  );
}