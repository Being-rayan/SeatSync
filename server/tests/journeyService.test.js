const assert = require("node:assert/strict");
const test = require("node:test");
const { createJourneyService } = require("../services/journeyService");

function createJourneyRow() {
  return {
    passenger_journey_id: 12,
    user_id: 88,
    pnr_or_ticket_ref: "PNR-900111",
    passenger_name: "Ishaan Kapoor",
    boarding_point: "New Delhi",
    drop_point: "Bhopal",
    verified: true,
    verified_at: new Date().toISOString(),
    assigned_seat_id: 41,
    original_assigned_seat_id: 41,
    assigned_seat_number: "5D",
    original_seat_number: "5D",
    journey_id: 7,
    journey_type: "train",
    journey_code: "12901 Rajdhani Express",
    journey_date: "2026-04-22",
    coach_or_bus_number: "S1",
    origin: "New Delhi",
    destination: "Bhopal"
  };
}

test("verifies a matching journey record", async () => {
  const notifications = [];
  const attaches = [];
  const service = createJourneyService({
    journeyRepository: {
      async findVerificationMatch() {
        return {
          passenger_journey_id: 12,
          user_id: null
        };
      },
      async attachUserAndVerify(passengerJourneyId, userId) {
        attaches.push({ passengerJourneyId, userId });
      },
      async getPassengerJourneyById() {
        return createJourneyRow();
      }
    },
    swapRepository: {
      async getActiveSeatRequests() {
        return [];
      }
    },
    notificationRepository: {
      async createNotification(payload) {
        notifications.push(payload);
      }
    },
    auditRepository: {
      async logAction() {}
    },
    expiryService: {
      async expireActiveRequests() {}
    }
  });

  const result = await service.verifyJourney(
    { id: 88, role: "passenger" },
    {
      journeyType: "train",
      reference: "PNR-900111",
      passengerName: "Ishaan Kapoor",
      journeyDate: "2026-04-22",
      coachOrBusNumber: "S1",
      assignedSeatNumber: "5D",
      boardingPoint: "New Delhi",
      destinationPoint: "Bhopal"
    }
  );

  assert.equal(attaches.length, 1);
  assert.equal(attaches[0].passengerJourneyId, 12);
  assert.equal(attaches[0].userId, 88);
  assert.equal(notifications.length, 1);
  assert.equal(result.journey.code, "12901 Rajdhani Express");
  assert.equal(result.assignedSeat.number, "5D");
});

test("rejects verification when credentials do not match seed data", async () => {
  const service = createJourneyService({
    journeyRepository: {
      async findVerificationMatch() {
        return null;
      }
    },
    swapRepository: {
      async getActiveSeatRequests() {
        return [];
      }
    },
    notificationRepository: {
      async createNotification() {}
    },
    auditRepository: {
      async logAction() {}
    },
    expiryService: {
      async expireActiveRequests() {}
    }
  });

  await assert.rejects(
    () =>
      service.verifyJourney(
        { id: 1, role: "passenger" },
        {
          journeyType: "train",
          reference: "NOPE",
          passengerName: "Unknown Passenger",
          journeyDate: "2026-04-22",
          coachOrBusNumber: "S1",
          assignedSeatNumber: "5D",
          boardingPoint: "New Delhi",
          destinationPoint: "Bhopal"
        }
      ),
    (error) => error.statusCode === 404
  );
});
