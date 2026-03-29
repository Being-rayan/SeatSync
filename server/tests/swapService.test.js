const assert = require("node:assert/strict");
const test = require("node:test");
const { createSwapService } = require("../services/swapService");

function buildSwapRow(overrides = {}) {
  return {
    id: 91,
    journey_id: 7,
    from_passenger_journey_id: 11,
    to_passenger_journey_id: 12,
    from_seat_id: 101,
    to_seat_id: 102,
    message: "Window for aisle",
    status: "pending",
    requester_final_confirmed: false,
    receiver_final_confirmed: false,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    journey_type: "train",
    journey_code: "12901 Rajdhani Express",
    journey_date: "2026-04-22",
    coach_or_bus_number: "S1",
    origin: "New Delhi",
    destination: "Bhopal",
    requester_user_id: 1,
    requester_name: "Arjun Mehta",
    receiver_user_id: 2,
    receiver_name: "Meera Nair",
    from_seat_number: "1A",
    from_seat_locked: false,
    to_seat_number: "1D",
    to_seat_locked: false,
    ...overrides
  };
}

test("creates a swap request when both seats are eligible", async () => {
  const notifications = [];
  const created = [];
  const service = createSwapService({
    journeyRepository: {
      async getPassengerJourneyByUserAndJourney() {
        return {
          passengerJourneyId: 11,
          passengerName: "Arjun Mehta",
          assignedSeat: { id: 101, number: "1A" }
        };
      }
    },
    swapRepository: {
      async findSeatById(seatId) {
        if (seatId === 101) {
          return {
            id: 101,
            journey_id: 7,
            coach_or_bus_number: "S1",
            seat_number: "1A",
            is_locked: false
          };
        }

        return {
          id: 102,
          journey_id: 7,
          coach_or_bus_number: "S1",
          seat_number: "1D",
          is_locked: false,
          passenger_journey_id: 12,
          occupant_user_id: 2,
          occupant_verified: true
        };
      },
      async findSeatConflicts() {
        return [];
      },
      async createSwapRequest(payload) {
        created.push(payload);
        return { id: 91 };
      },
      async getSwapById() {
        return buildSwapRow();
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

  const result = await service.createSwapRequest(
    { id: 1, role: "passenger" },
    {
      journeyId: 7,
      toSeatId: 102,
      message: "Window for aisle"
    }
  );

  assert.equal(created.length, 1);
  assert.equal(notifications.length, 1);
  assert.equal(result.status, "pending");
  assert.equal(result.requester.seat.number, "1A");
});

test("prevents duplicate active requests on locked seat pairs", async () => {
  const service = createSwapService({
    journeyRepository: {
      async getPassengerJourneyByUserAndJourney() {
        return {
          passengerJourneyId: 11,
          passengerName: "Arjun Mehta",
          assignedSeat: { id: 101, number: "1A" }
        };
      }
    },
    swapRepository: {
      async findSeatById(seatId) {
        if (seatId === 101) {
          return {
            id: 101,
            journey_id: 7,
            coach_or_bus_number: "S1",
            seat_number: "1A",
            is_locked: false
          };
        }

        return {
          id: 102,
          journey_id: 7,
          coach_or_bus_number: "S1",
          seat_number: "1D",
          is_locked: false,
          passenger_journey_id: 12,
          occupant_user_id: 2,
          occupant_verified: true
        };
      },
      async findSeatConflicts() {
        return [{ id: 55, status: "pending" }];
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
      service.createSwapRequest(
        { id: 1, role: "passenger" },
        {
          journeyId: 7,
          toSeatId: 102,
          message: "Window for aisle"
        }
      ),
    (error) => error.statusCode === 409
  );
});

test("completes a swap only after both passengers confirm", async () => {
  const state = buildSwapRow({ status: "accepted" });
  let completed = false;
  let createNotificationCalls = 0;
  let createNotificationsCalls = 0;

  const service = createSwapService({
    transactionRunner: async (handler) => handler({}),
    journeyRepository: {
      async getPassengerJourneyByUserAndJourney() {
        return null;
      }
    },
    swapRepository: {
      async getSwapById() {
        return { ...state };
      },
      async markRequesterConfirmed() {
        state.requester_final_confirmed = true;
      },
      async markReceiverConfirmed() {
        state.receiver_final_confirmed = true;
      },
      async completeSwap() {
        state.status = "completed";
        completed = true;
      }
    },
    notificationRepository: {
      async createNotification() {
        createNotificationCalls += 1;
      },
      async createNotifications() {
        createNotificationsCalls += 1;
      }
    },
    auditRepository: {
      async logAction() {}
    },
    expiryService: {
      async expireActiveRequests() {}
    }
  });

  const firstConfirm = await service.finalConfirm({ id: 1, role: "passenger" }, 91);
  assert.equal(firstConfirm.status, "accepted");
  assert.equal(firstConfirm.requesterFinalConfirmed, true);
  assert.equal(completed, false);
  assert.equal(createNotificationCalls, 1);

  const secondConfirm = await service.finalConfirm({ id: 2, role: "passenger" }, 91);
  assert.equal(secondConfirm.status, "completed");
  assert.equal(completed, true);
  assert.equal(createNotificationsCalls, 1);
});
