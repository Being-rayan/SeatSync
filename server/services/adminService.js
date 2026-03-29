const {
  auditRepository,
  journeyRepository,
  swapRepository,
  userRepository
} = require("../runtime/repositories");
const ApiError = require("../utils/apiError");
const { serializeUser } = require("../utils/serializers");
const { assertPositiveInteger } = require("../utils/validators");
const { expiryService } = require("./expiryService");

function createAdminService(dependencies = {}) {
  const users = dependencies.userRepository || userRepository;
  const journeys = dependencies.journeyRepository || journeyRepository;
  const swaps = dependencies.swapRepository || swapRepository;
  const auditLogs = dependencies.auditRepository || auditRepository;
  const expiry = dependencies.expiryService || expiryService;

  async function listJourneys(filters) {
    await expiry.expireActiveRequests();
    return journeys.listJourneys(filters);
  }

  async function listUsers() {
    const rows = await users.listUsers();
    return rows.map((row) => ({
      ...serializeUser(row),
      verifiedJourneyCount: Number(row.verified_journey_count || 0),
      lastVerifiedAt: row.last_verified_at
    }));
  }

  async function listSwaps(filters) {
    await expiry.expireActiveRequests();
    return swaps.listSwaps(filters);
  }

  async function getAnalytics() {
    await expiry.expireActiveRequests();
    const analytics = await swaps.getAnalytics();

    return {
      totalJourneys: Number(analytics.total_journeys || 0),
      totalUsers: Number(analytics.total_users || 0),
      totalSeats: Number(analytics.total_seats || 0),
      totalSwapRequests: Number(analytics.total_swap_requests || 0),
      completedSwaps: Number(analytics.completed_swaps || 0),
      pendingRequests: Number(analytics.pending_requests || 0)
    };
  }

  async function listSeats(filters) {
    return journeys.listSeats(filters);
  }

  async function lockSeat(actor, seatId) {
    const seat = await journeys.setSeatLock(assertPositiveInteger(seatId, "Seat id"), true);

    if (!seat) {
      throw new ApiError(404, "Seat not found.");
    }

    await auditLogs.logAction({
      actorUserId: actor.id,
      action: "seat_locked",
      entityType: "seat",
      entityId: seat.id,
      details: { journeyId: Number(seat.journey_id), seatNumber: seat.seat_number }
    });

    return seat;
  }

  async function unlockSeat(actor, seatId) {
    const seat = await journeys.setSeatLock(assertPositiveInteger(seatId, "Seat id"), false);

    if (!seat) {
      throw new ApiError(404, "Seat not found.");
    }

    await auditLogs.logAction({
      actorUserId: actor.id,
      action: "seat_unlocked",
      entityType: "seat",
      entityId: seat.id,
      details: { journeyId: Number(seat.journey_id), seatNumber: seat.seat_number }
    });

    return seat;
  }

  return {
    getAnalytics,
    listJourneys,
    listSeats,
    listSwaps,
    listUsers,
    lockSeat,
    unlockSeat
  };
}

const adminService = createAdminService();

module.exports = {
  adminService,
  createAdminService
};
