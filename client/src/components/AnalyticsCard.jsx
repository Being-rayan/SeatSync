function AnalyticsCard({ label, value, accent = "brand" }) {
  return (
    <article className={`analytics-card analytics-card--${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default AnalyticsCard;
