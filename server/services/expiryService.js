const {
  auditRepository,
  notificationRepository,
  swapRepository
} = require("../runtime/repositories");
const { ACTIVE_SWAP_STATUSES } = require("../utils/constants");

function createExpiryService(dependencies = {}) {
  const swaps = dependencies.swapRepository || swapRepository;
  const notifications = dependencies.notificationRepository || notificationRepository;
  const auditLogs = dependencies.auditRepository || auditRepository;

  async function expireActiveRequests() {
    const expiredRows = await swaps.expireActiveRequests(new Date(), ACTIVE_SWAP_STATUSES);

    for (const row of expiredRows) {
      const meta = {
        swapRequestId: Number(row.id),
        journeyId: Number(row.journey_id)
      };
      const batch = [];

      if (row.requester_user_id) {
        batch.push({
          userId: row.requester_user_id,
          type: "swap_expired",
          title: "Seat swap expired",
          body: "Your pending seat swap request expired before completion.",
          meta
        });
      }

      if (row.receiver_user_id) {
        batch.push({
          userId: row.receiver_user_id,
          type: "swap_expired",
          title: "Seat swap expired",
          body: "A seat swap linked to your journey expired automatically.",
          meta
        });
      }

      if (batch.length) {
        await notifications.createNotifications(batch);
      }

      await auditLogs.logAction({
        actorUserId: null,
        action: "swap_request_expired",
        entityType: "swap_request",
        entityId: row.id,
        details: meta
      });
    }

    return expiredRows.length;
  }

  return {
    expireActiveRequests
  };
}

const expiryService = createExpiryService();

module.exports = {
  createExpiryService,
  expiryService
};
