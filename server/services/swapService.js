const env = require("../config/env");
const {
  auditRepository,
  journeyRepository,
  notificationRepository,
  swapRepository,
  transactionRunner
} = require("../runtime/repositories");
const ApiError = require("../utils/apiError");
const { ACTIVE_SWAP_STATUSES, ROLES, SWAP_STATUSES } = require("../utils/constants");
const { serializeJourneyContext, serializeSwap } = require("../utils/serializers");
const {
  assertOptionalMessage,
  assertPositiveInteger
} = require("../utils/validators");
const { expiryService } = require("./expiryService");

function createSwapService(dependencies = {}) {
  const swaps = dependencies.swapRepository || swapRepository;
  const journeys = dependencies.journeyRepository || journeyRepository;
  const notifications = dependencies.notificationRepository || notificationRepository;
  const auditLogs = dependencies.auditRepository || auditRepository;
  const expiry = dependencies.expiryService || expiryService;
  const runTransaction = dependencies.transactionRunner || transactionRunner;

  async function getAuthorizedSwap(actor, swapId) {
    const swap = await swaps.getSwapById(swapId);

    if (!swap) {
      throw new ApiError(404, "Swap request not found.");
    }

    const actorId = Number(actor.id);
    const requesterId = Number(swap.requester_user_id || 0);
    const receiverId = Number(swap.receiver_user_id || 0);

    if (actor.role !== ROLES.ADMIN && actorId !== requesterId && actorId !== receiverId) {
      throw new ApiError(403, "You do not have access to this swap request.");
    }

    return swap;
  }

  async function createSwapRequest(actor, payload) {
    await expiry.expireActiveRequests();

    const journeyId = assertPositiveInteger(payload.journeyId, "Journey id");
    const toSeatId = assertPositiveInteger(payload.toSeatId, "Target seat id");
    const message = assertOptionalMessage(payload.message);

    const requesterJourneyRow = await journeys.getPassengerJourneyByUserAndJourney(actor.id, journeyId);

    if (!requesterJourneyRow) {
      throw new ApiError(403, "You must verify this journey before creating a swap request.");
    }

    const requesterJourney = requesterJourneyRow.assignedSeat
      ? requesterJourneyRow
      : serializeJourneyContext(requesterJourneyRow);
    const requesterSeatId = Number(requesterJourney.assignedSeat.id);

    if (requesterSeatId === toSeatId) {
      throw new ApiError(400, "You cannot request a swap with your own seat.");
    }

    const requesterSeat = await swaps.findSeatById(requesterSeatId);
    const targetSeat = await swaps.findSeatById(toSeatId);

    if (!requesterSeat || !targetSeat) {
      throw new ApiError(404, "One or more selected seats do not exist.");
    }

    if (Number(targetSeat.journey_id) !== journeyId || Number(requesterSeat.journey_id) !== journeyId) {
      throw new ApiError(400, "Both seats must belong to the same journey.");
    }

    if (requesterSeat.coach_or_bus_number !== targetSeat.coach_or_bus_number) {
      throw new ApiError(400, "Swaps are allowed only within the same coach or bus.");
    }

    if (!targetSeat.passenger_journey_id || !targetSeat.occupant_verified || !targetSeat.occupant_user_id) {
      throw new ApiError(409, "That seat is not eligible for a verified digital swap.");
    }

    if (Number(targetSeat.occupant_user_id) === Number(actor.id)) {
      throw new ApiError(400, "You cannot request a swap from your own account.");
    }

    if (requesterSeat.is_locked || targetSeat.is_locked) {
      throw new ApiError(409, "One of the selected seats is currently locked by an administrator.");
    }

    const conflicts = await swaps.findSeatConflicts(
      journeyId,
      [requesterSeatId, toSeatId],
      ACTIVE_SWAP_STATUSES
    );

    if (conflicts.length) {
      throw new ApiError(
        409,
        "One of the selected seats is already involved in another active swap request."
      );
    }

    const expiresAt = new Date(Date.now() + env.swapRequestExpiryMinutes * 60 * 1000);
    const createdSwap = await swaps.createSwapRequest({
      journeyId,
      fromPassengerJourneyId: requesterJourney.passengerJourneyId,
      toPassengerJourneyId: Number(targetSeat.passenger_journey_id),
      fromSeatId: requesterSeatId,
      toSeatId,
      message,
      status: SWAP_STATUSES.PENDING,
      expiresAt
    });
    const fullSwap = await swaps.getSwapById(createdSwap.id);

    await notifications.createNotification({
      userId: targetSeat.occupant_user_id,
      type: "swap_request_new",
      title: "New seat swap request",
      body: `${requesterJourney.passengerName} requested a seat exchange for seat ${targetSeat.seat_number}.`,
      meta: {
        swapRequestId: Number(fullSwap.id),
        journeyId,
        fromSeatId: requesterSeatId,
        toSeatId
      }
    });

    await auditLogs.logAction({
      actorUserId: actor.id,
      action: "swap_request_created",
      entityType: "swap_request",
      entityId: fullSwap.id,
      details: {
        journeyId,
        fromSeatId: requesterSeatId,
        toSeatId
      }
    });

    return serializeSwap(fullSwap, Number(actor.id));
  }

  async function listIncoming(actor, journeyId) {
    await expiry.expireActiveRequests();

    const normalizedJourneyId = journeyId ? assertPositiveInteger(journeyId, "Journey id") : null;

    if (normalizedJourneyId) {
      const verifiedJourney = await journeys.getPassengerJourneyByUserAndJourney(
        actor.id,
        normalizedJourneyId
      );

      if (!verifiedJourney && actor.role !== ROLES.ADMIN) {
        throw new ApiError(403, "You do not have verified access to that journey.");
      }
    }

    const rows = await swaps.listIncomingByUser(actor.id, normalizedJourneyId);
    return rows.map((row) => serializeSwap(row, Number(actor.id)));
  }

  async function listOutgoing(actor, journeyId) {
    await expiry.expireActiveRequests();

    const normalizedJourneyId = journeyId ? assertPositiveInteger(journeyId, "Journey id") : null;

    if (normalizedJourneyId) {
      const verifiedJourney = await journeys.getPassengerJourneyByUserAndJourney(
        actor.id,
        normalizedJourneyId
      );

      if (!verifiedJourney && actor.role !== ROLES.ADMIN) {
        throw new ApiError(403, "You do not have verified access to that journey.");
      }
    }

    const rows = await swaps.listOutgoingByUser(actor.id, normalizedJourneyId);
    return rows.map((row) => serializeSwap(row, Number(actor.id)));
  }

  async function getById(actor, swapId) {
    await expiry.expireActiveRequests();
    const swap = await getAuthorizedSwap(actor, assertPositiveInteger(swapId, "Swap id"));
    return serializeSwap(swap, Number(actor.id));
  }

  async function accept(actor, swapId) {
    await expiry.expireActiveRequests();

    const swap = await getAuthorizedSwap(actor, assertPositiveInteger(swapId, "Swap id"));

    if (Number(swap.receiver_user_id) !== Number(actor.id)) {
      throw new ApiError(403, "Only the receiving passenger can accept this request.");
    }

    if (swap.status !== SWAP_STATUSES.PENDING) {
      throw new ApiError(409, "Only pending requests can be accepted.");
    }

    if (swap.from_seat_locked || swap.to_seat_locked) {
      throw new ApiError(409, "A seat involved in this request is locked.");
    }

    await swaps.updateStatus(swap.id, SWAP_STATUSES.ACCEPTED);
    const updatedSwap = await swaps.getSwapById(swap.id);

    await notifications.createNotifications([
      {
        userId: swap.requester_user_id,
        type: "swap_request_accepted",
        title: "Swap accepted",
        body: `${swap.receiver_name} accepted your request. Final digital consent is now required.`,
        meta: { swapRequestId: Number(swap.id), journeyId: Number(swap.journey_id) }
      },
      {
        userId: swap.receiver_user_id,
        type: "swap_confirmation_pending",
        title: "Final confirmation pending",
        body: "Both passengers must now confirm the seat exchange to complete it.",
        meta: { swapRequestId: Number(swap.id), journeyId: Number(swap.journey_id) }
      }
    ]);

    await auditLogs.logAction({
      actorUserId: actor.id,
      action: "swap_request_accepted",
      entityType: "swap_request",
      entityId: swap.id,
      details: { journeyId: Number(swap.journey_id) }
    });

    return serializeSwap(updatedSwap, Number(actor.id));
  }

  async function reject(actor, swapId) {
    await expiry.expireActiveRequests();

    const swap = await getAuthorizedSwap(actor, assertPositiveInteger(swapId, "Swap id"));

    if (Number(swap.receiver_user_id) !== Number(actor.id)) {
      throw new ApiError(403, "Only the receiving passenger can reject this request.");
    }

    if (swap.status !== SWAP_STATUSES.PENDING) {
      throw new ApiError(409, "Only pending requests can be rejected.");
    }

    await swaps.updateStatus(swap.id, SWAP_STATUSES.REJECTED);
    const updatedSwap = await swaps.getSwapById(swap.id);

    await notifications.createNotifications([
      {
        userId: swap.requester_user_id,
        type: "swap_request_rejected",
        title: "Swap rejected",
        body: `${swap.receiver_name} rejected your seat swap request.`,
        meta: { swapRequestId: Number(swap.id), journeyId: Number(swap.journey_id) }
      },
      {
        userId: swap.receiver_user_id,
        type: "swap_request_rejected",
        title: "Request closed",
        body: "You rejected this seat swap request.",
        meta: { swapRequestId: Number(swap.id), journeyId: Number(swap.journey_id) }
      }
    ]);

    await auditLogs.logAction({
      actorUserId: actor.id,
      action: "swap_request_rejected",
      entityType: "swap_request",
      entityId: swap.id,
      details: { journeyId: Number(swap.journey_id) }
    });

    return serializeSwap(updatedSwap, Number(actor.id));
  }

  async function cancel(actor, swapId) {
    await expiry.expireActiveRequests();

    const swap = await getAuthorizedSwap(actor, assertPositiveInteger(swapId, "Swap id"));

    if (Number(swap.requester_user_id) !== Number(actor.id)) {
      throw new ApiError(403, "Only the requesting passenger can cancel this request.");
    }

    if (swap.status !== SWAP_STATUSES.PENDING) {
      throw new ApiError(409, "Only pending requests can be cancelled.");
    }

    await swaps.updateStatus(swap.id, SWAP_STATUSES.CANCELLED);
    const updatedSwap = await swaps.getSwapById(swap.id);

    await notifications.createNotifications([
      {
        userId: swap.receiver_user_id,
        type: "swap_request_cancelled",
        title: "Swap cancelled",
        body: `${swap.requester_name} cancelled the seat swap request.`,
        meta: { swapRequestId: Number(swap.id), journeyId: Number(swap.journey_id) }
      },
      {
        userId: swap.requester_user_id,
        type: "swap_request_cancelled",
        title: "Request cancelled",
        body: "Your pending swap request has been cancelled.",
        meta: { swapRequestId: Number(swap.id), journeyId: Number(swap.journey_id) }
      }
    ]);

    await auditLogs.logAction({
      actorUserId: actor.id,
      action: "swap_request_cancelled",
      entityType: "swap_request",
      entityId: swap.id,
      details: { journeyId: Number(swap.journey_id) }
    });

    return serializeSwap(updatedSwap, Number(actor.id));
  }

  async function finalConfirm(actor, swapId) {
    await expiry.expireActiveRequests();

    const normalizedSwapId = assertPositiveInteger(swapId, "Swap id");
    const actorId = Number(actor.id);

    return runTransaction(async (client) => {
      const swap = await swaps.getSwapById(normalizedSwapId, client);

      if (!swap) {
        throw new ApiError(404, "Swap request not found.");
      }

      if (swap.status !== SWAP_STATUSES.ACCEPTED) {
        throw new ApiError(409, "This request is not waiting for final confirmation.");
      }

      const isRequester = actorId === Number(swap.requester_user_id);
      const isReceiver = actorId === Number(swap.receiver_user_id);

      if (!isRequester && !isReceiver) {
        throw new ApiError(403, "You do not have access to confirm this request.");
      }

      if (isRequester && !swap.requester_final_confirmed) {
        await swaps.markRequesterConfirmed(swap.id, client);
      }

      if (isReceiver && !swap.receiver_final_confirmed) {
        await swaps.markReceiverConfirmed(swap.id, client);
      }

      const refreshedSwap = await swaps.getSwapById(swap.id, client);
      const isComplete =
        refreshedSwap.requester_final_confirmed && refreshedSwap.receiver_final_confirmed;

      if (isComplete) {
        await swaps.completeSwap(refreshedSwap, client);

        await notifications.createNotifications(
          [
            {
              userId: refreshedSwap.requester_user_id,
              type: "swap_completed",
              title: "Seat swap completed",
              body: `Your seat has been exchanged with ${refreshedSwap.receiver_name}.`,
              meta: {
                swapRequestId: Number(refreshedSwap.id),
                journeyId: Number(refreshedSwap.journey_id)
              }
            },
            {
              userId: refreshedSwap.receiver_user_id,
              type: "swap_completed",
              title: "Seat swap completed",
              body: `Your seat has been exchanged with ${refreshedSwap.requester_name}.`,
              meta: {
                swapRequestId: Number(refreshedSwap.id),
                journeyId: Number(refreshedSwap.journey_id)
              }
            }
          ],
          client
        );

        await auditLogs.logAction(
          {
            actorUserId: actorId,
            action: "swap_request_completed",
            entityType: "swap_request",
            entityId: refreshedSwap.id,
            details: {
              journeyId: Number(refreshedSwap.journey_id),
              fromSeatId: Number(refreshedSwap.from_seat_id),
              toSeatId: Number(refreshedSwap.to_seat_id)
            }
          },
          client
        );
      } else {
        const otherUserId = isRequester
          ? refreshedSwap.receiver_user_id
          : refreshedSwap.requester_user_id;

        await notifications.createNotification(
          {
            userId: otherUserId,
            type: "swap_confirmation_pending",
            title: "Counterparty confirmed",
            body: "The other passenger confirmed. Your final confirmation is now required.",
            meta: {
              swapRequestId: Number(refreshedSwap.id),
              journeyId: Number(refreshedSwap.journey_id)
            }
          },
          client
        );

        await auditLogs.logAction(
          {
            actorUserId: actorId,
            action: "swap_request_final_confirmed",
            entityType: "swap_request",
            entityId: refreshedSwap.id,
            details: { journeyId: Number(refreshedSwap.journey_id) }
          },
          client
        );
      }

      const finalSwap = await swaps.getSwapById(swap.id, client);
      return serializeSwap(finalSwap, actorId);
    });
  }

  return {
    accept,
    cancel,
    createSwapRequest,
    finalConfirm,
    getById,
    listIncoming,
    listOutgoing,
    reject
  };
}

const swapService = createSwapService();

module.exports = {
  createSwapService,
  swapService
};
