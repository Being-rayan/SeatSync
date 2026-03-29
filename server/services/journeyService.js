const {
  auditRepository,
  journeyRepository,
  notificationRepository,
  swapRepository
} = require("../runtime/repositories");
const ApiError = require("../utils/apiError");
const { ROLES, SWAP_STATUSES } = require("../utils/constants");
const { serializeJourneyContext } = require("../utils/serializers");
const {
  assertDate,
  assertJourneyType,
  assertPositiveInteger,
  assertRequiredString
} = require("../utils/validators");
const { expiryService } = require("./expiryService");

function createJourneyService(dependencies = {}) {
  const journeys = dependencies.journeyRepository || journeyRepository;
  const swaps = dependencies.swapRepository || swapRepository;
  const notifications = dependencies.notificationRepository || notificationRepository;
  const auditLogs = dependencies.auditRepository || auditRepository;
  const expiry = dependencies.expiryService || expiryService;

  async function verifyJourney(actor, payload) {
    const match = await journeys.findVerificationMatch({
      journeyType: assertJourneyType(payload.journeyType),
      reference: assertRequiredString(payload.reference, "Reference", { maxLength: 80 }),
      passengerName: assertRequiredString(payload.passengerName, "Passenger name", {
        minLength: 2,
        maxLength: 120
      }),
      journeyDate: assertDate(payload.journeyDate, "Journey date"),
      coachOrBusNumber: assertRequiredString(payload.coachOrBusNumber, "Coach or bus number", {
        maxLength: 30
      }),
      seatNumber: assertRequiredString(payload.assignedSeatNumber, "Assigned seat number", {
        maxLength: 20
      }),
      boardingPoint: assertRequiredString(payload.boardingPoint, "Boarding point", {
        maxLength: 120
      }),
      destinationPoint: assertRequiredString(payload.destinationPoint, "Destination point", {
        maxLength: 120
      })
    });

    if (!match) {
      throw new ApiError(404, "Journey credentials did not match any verified demo record.");
    }

    if (match.user_id && Number(match.user_id) !== Number(actor.id)) {
      throw new ApiError(409, "That journey record is already linked to another account.");
    }

    await journeys.attachUserAndVerify(match.passenger_journey_id, actor.id);
    const verifiedJourney = await journeys.getPassengerJourneyById(match.passenger_journey_id);

    await notifications.createNotification({
      userId: actor.id,
      type: "journey_verified",
      title: "Journey verified",
      body: `Access granted for ${verifiedJourney.journey_code} in ${verifiedJourney.coach_or_bus_number}.`,
      meta: {
        journeyId: Number(verifiedJourney.journey_id),
        passengerJourneyId: Number(verifiedJourney.passenger_journey_id)
      }
    });

    await auditLogs.logAction({
      actorUserId: actor.id,
      action: "journey_verified",
      entityType: "passenger_journey",
      entityId: verifiedJourney.passenger_journey_id,
      details: {
        journeyId: Number(verifiedJourney.journey_id),
        seatId: Number(verifiedJourney.assigned_seat_id)
      }
    });

    return serializeJourneyContext(verifiedJourney);
  }

  async function getCurrentJourney(userId) {
    const currentJourney = await journeys.getLatestVerifiedJourneyByUser(userId);
    return serializeJourneyContext(currentJourney);
  }

  async function getSeatMap(actor, rawJourneyId) {
    await expiry.expireActiveRequests();

    const journeyId = assertPositiveInteger(rawJourneyId, "Journey id");
    const journey = await journeys.getJourneyById(journeyId);

    if (!journey) {
      throw new ApiError(404, "Journey not found.");
    }

    let viewerJourney = null;

    if (actor.role !== ROLES.ADMIN) {
      viewerJourney = await journeys.getPassengerJourneyByUserAndJourney(actor.id, journeyId);

      if (!viewerJourney) {
        throw new ApiError(403, "You do not have verified access to this journey.");
      }
    }

    const seats = await journeys.getSeatMapRows(journeyId);
    const activeRequests = await swaps.getActiveSeatRequests(journeyId, [
      SWAP_STATUSES.PENDING,
      SWAP_STATUSES.ACCEPTED
    ]);
    const activeSeatMap = new Map();

    activeRequests.forEach((request) => {
      activeSeatMap.set(Number(request.from_seat_id), Number(request.id));
      activeSeatMap.set(Number(request.to_seat_id), Number(request.id));
    });

    const serializedViewerJourney = viewerJourney ? serializeJourneyContext(viewerJourney) : null;
    const viewerSeatId = serializedViewerJourney?.assignedSeat
      ? Number(serializedViewerJourney.assignedSeat.id)
      : null;

    return {
      viewerJourney: serializedViewerJourney,
      journey: {
        id: Number(journey.id),
        type: journey.journey_type,
        code: journey.journey_code,
        date: journey.journey_date,
        coachOrBusNumber: journey.coach_or_bus_number,
        origin: journey.origin,
        destination: journey.destination
      },
      seats: seats.map((seat) => {
        const seatId = Number(seat.id);
        const isOwnSeat = viewerSeatId === seatId;
        const isSwapped =
          Boolean(seat.passenger_journey_id) &&
          seat.original_assigned_seat_id &&
          Number(seat.original_assigned_seat_id) !== seatId;
        const hasActiveRequest = activeSeatMap.has(seatId);
        const occupiedByVerifiedPeer =
          Boolean(seat.passenger_journey_id) &&
          Boolean(seat.occupant_verified) &&
          Number(seat.occupant_user_id) !== Number(actor.id);
        let primaryState = "vacant";

        if (isOwnSeat) {
          primaryState = "mine";
        } else if (seat.is_locked) {
          primaryState = "locked";
        } else if (hasActiveRequest) {
          primaryState = "pending";
        } else if (occupiedByVerifiedPeer) {
          primaryState = "available";
        } else if (seat.passenger_journey_id) {
          primaryState = "occupied";
        }

        return {
          id: seatId,
          seatNumber: seat.seat_number,
          seatType: seat.seat_type,
          layoutX: Number(seat.layout_x),
          layoutY: Number(seat.layout_y),
          isWindow: seat.is_window,
          isAisle: seat.is_aisle,
          isLocked: seat.is_locked,
          isSwapped,
          hasActiveRequest,
          primaryState,
          activeSwapRequestId: activeSeatMap.get(seatId) || null,
          occupant: seat.passenger_journey_id
            ? {
                passengerJourneyId: Number(seat.passenger_journey_id),
                userId: seat.occupant_user_id ? Number(seat.occupant_user_id) : null,
                passengerName: seat.passenger_name,
                verified: seat.occupant_verified,
                displayName: seat.occupant_account_name || seat.passenger_name
              }
            : null
        };
      })
    };
  }

  return {
    getCurrentJourney,
    getSeatMap,
    verifyJourney
  };
}

const journeyService = createJourneyService();

module.exports = {
  createJourneyService,
  journeyService
};
