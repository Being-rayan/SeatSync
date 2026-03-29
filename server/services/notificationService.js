const { notificationRepository } = require("../runtime/repositories");
const ApiError = require("../utils/apiError");
const { serializeNotification } = require("../utils/serializers");
const { assertPositiveInteger } = require("../utils/validators");

function createNotificationService(dependencies = {}) {
  const notifications = dependencies.notificationRepository || notificationRepository;

  async function list(userId) {
    const rows = await notifications.listByUser(userId);
    return rows.map(serializeNotification);
  }

  async function markRead(userId, notificationId) {
    const row = await notifications.markRead(
      userId,
      assertPositiveInteger(notificationId, "Notification id")
    );

    if (!row) {
      throw new ApiError(404, "Notification not found.");
    }

    return serializeNotification(row);
  }

  return {
    list,
    markRead
  };
}

const notificationService = createNotificationService();

module.exports = {
  createNotificationService,
  notificationService
};
