import { capitalizeLabel } from "../utils/formatters";

const toneMap = {
  pending: "warning",
  accepted: "info",
  completed: "success",
  rejected: "danger",
  cancelled: "muted",
  expired: "muted",
  mine: "brand",
  available: "success",
  occupied: "muted",
  locked: "danger",
  vacant: "muted",
  final_confirmation: "info"
};

function StatusBadge({ value }) {
  const tone = toneMap[value] || "muted";

  return <span className={`badge badge--${tone}`}>{capitalizeLabel(value)}</span>;
}

export default StatusBadge;
