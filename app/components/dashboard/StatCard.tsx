type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: string;
};

export default function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <div className="lp-stat-card">
      <div className="lp-stat-icon" aria-hidden="true">{icon}</div>
      <div>
        <p className="lp-eyebrow">{label}</p>
        <p className="lp-stat-value">{value}</p>
        <p className="lp-muted">{hint}</p>
      </div>
    </div>
  );
}
