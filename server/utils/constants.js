const ROLES = {
  PASSENGER: "passenger",
  ADMIN: "admin"
};

const JOURNEY_TYPES = {
  TRAIN: "train",
  BUS: "bus"
};

const SWAP_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  EXPIRED: "expired",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
};

const ACTIVE_SWAP_STATUSES = [SWAP_STATUSES.PENDING, SWAP_STATUSES.ACCEPTED];

module.exports = {
  ROLES,
  JOURNEY_TYPES,
  SWAP_STATUSES,
  ACTIVE_SWAP_STATUSES
};
