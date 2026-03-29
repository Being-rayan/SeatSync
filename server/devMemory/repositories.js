const { nextIds, state, timestamp } = require("./store");

function toComparable(value) {
  return String(value || "").trim().toLowerCase();
}

function includesText(value, filter) {
  return toComparable(value).includes(toComparable(filter));
}

function findUser(id) {
  return state.users.find((user) => Number(user.id) === Number(id)) || null;
}

function findJourney(id) {
  return state.journeys.find((journey) => Number(journey.id) === Number(id)) || null;
}

function findSeat(id) {
  return state.seats.find((seat) => Number(seat.id) === Number(id)) || null;
}

function findPassengerJourney(id) {
  return state.passengerJourneys.find((journey) => Number(journey.id) === Number(id)) || null;
}

function findSwap(id) {
  return state.swapRequests.find((swap) => Number(swap.id) === Number(id)) || null;
}

function syncSeatOccupants() {
  for (const seat of state.seats) {
    seat.current_passenger_journey_id = null;
  }

  for (const passengerJourney of state.passengerJourneys) {
    const seat = findSeat(passengerJourney.assigned_seat_id);

    if (seat) {
      seat.current_passenger_journey_id = passengerJourney.id;
    }
  }
}

function hydratePassengerJourneyRow(passengerJourney) {
  if (!passengerJourney) {
    return null;
  }

  const journey = findJourney(passengerJourney.journey_id);
  const assignedSeat = findSeat(passengerJourney.assigned_seat_id);
  const originalSeat = findSeat(passengerJourney.original_assigned_seat_id);

  return {
    passenger_journey_id: passengerJourney.id,
    user_id: passengerJourney.user_id,
    pnr_or_ticket_ref: passengerJourney.pnr_or_ticket_ref,
    passenger_name: passengerJourney.passenger_name,
    boarding_point: passengerJourney.boarding_point,
    drop_point: passengerJourney.drop_point,
    verified: passengerJourney.verified,
    verified_at: passengerJourney.verified_at,
    assigned_seat_id: passengerJourney.assigned_seat_id,
    original_assigned_seat_id: passengerJourney.original_assigned_seat_id,
    assigned_seat_number: assignedSeat ? assignedSeat.seat_number : null,
    original_seat_number: originalSeat ? originalSeat.seat_number : null,
    journey_id: journey.id,
    journey_type: journey.journey_type,
    journey_code: journey.journey_code,
    journey_date: journey.journey_date,
    coach_or_bus_number: journey.coach_or_bus_number,
    origin: journey.origin,
    destination: journey.destination
  };
}

function hydrateSeatRow(seat) {
  const occupantJourney = seat.current_passenger_journey_id
    ? findPassengerJourney(seat.current_passenger_journey_id)
    : null;
  const occupantUser = occupantJourney && occupantJourney.user_id ? findUser(occupantJourney.user_id) : null;
  const journey = findJourney(seat.journey_id);

  return {
    id: seat.id,
    journey_id: seat.journey_id,
    coach_or_bus_number: seat.coach_or_bus_number,
    seat_number: seat.seat_number,
    seat_type: seat.seat_type,
    layout_x: seat.layout_x,
    layout_y: seat.layout_y,
    is_window: seat.is_window,
    is_aisle: seat.is_aisle,
    is_locked: seat.is_locked,
    passenger_journey_id: occupantJourney ? occupantJourney.id : null,
    occupant_user_id: occupantJourney ? occupantJourney.user_id : null,
    passenger_name: occupantJourney ? occupantJourney.passenger_name : null,
    occupant_verified: occupantJourney ? occupantJourney.verified : false,
    original_assigned_seat_id: occupantJourney ? occupantJourney.original_assigned_seat_id : null,
    occupant_account_name: occupantUser ? occupantUser.name : null,
    journey_type: journey.journey_type,
    journey_code: journey.journey_code,
    journey_date: journey.journey_date,
    origin: journey.origin,
    destination: journey.destination,
    occupant_email: occupantUser ? occupantUser.email : null
  };
}

function hydrateSwapRow(swap) {
  if (!swap) {
    return null;
  }

  const journey = findJourney(swap.journey_id);
  const requester = findPassengerJourney(swap.from_passenger_journey_id);
  const receiver = findPassengerJourney(swap.to_passenger_journey_id);
  const fromSeat = findSeat(swap.from_seat_id);
  const toSeat = findSeat(swap.to_seat_id);

  return {
    id: swap.id,
    journey_id: swap.journey_id,
    from_passenger_journey_id: swap.from_passenger_journey_id,
    to_passenger_journey_id: swap.to_passenger_journey_id,
    from_seat_id: swap.from_seat_id,
    to_seat_id: swap.to_seat_id,
    message: swap.message,
    status: swap.status,
    requester_final_confirmed: swap.requester_final_confirmed,
    receiver_final_confirmed: swap.receiver_final_confirmed,
    expires_at: swap.expires_at,
    created_at: swap.created_at,
    updated_at: swap.updated_at,
    journey_type: journey.journey_type,
    journey_code: journey.journey_code,
    journey_date: journey.journey_date,
    coach_or_bus_number: journey.coach_or_bus_number,
    origin: journey.origin,
    destination: journey.destination,
    requester_user_id: requester ? requester.user_id : null,
    requester_name: requester ? requester.passenger_name : null,
    receiver_user_id: receiver ? receiver.user_id : null,
    receiver_name: receiver ? receiver.passenger_name : null,
    from_seat_number: fromSeat ? fromSeat.seat_number : null,
    from_seat_locked: fromSeat ? fromSeat.is_locked : false,
    to_seat_number: toSeat ? toSeat.seat_number : null,
    to_seat_locked: toSeat ? toSeat.is_locked : false
  };
}

const userRepository = {
  async findByEmail(email) {
    return state.users.find((user) => toComparable(user.email) === toComparable(email)) || null;
  },
  async findById(id) {
    return findUser(id);
  },
  async createUser(user) {
    const row = {
      id: nextIds.user += 1,
      name: user.name,
      email: user.email,
      password_hash: user.passwordHash,
      role: user.role,
      created_at: timestamp(),
      updated_at: timestamp()
    };
    state.users.push(row);
    return { id: row.id, name: row.name, email: row.email, role: row.role, created_at: row.created_at, updated_at: row.updated_at };
  },
  async listUsers() {
    return state.users
      .map((user) => {
        const verifiedJourneys = state.passengerJourneys.filter(
          (journey) => Number(journey.user_id) === Number(user.id) && journey.verified
        );
        const latest = verifiedJourneys.map((journey) => journey.verified_at).filter(Boolean).sort().at(-1) || null;
        return { ...user, verified_journey_count: verifiedJourneys.length, last_verified_at: latest };
      })
      .sort((left, right) => {
        if (left.role !== right.role) {
          return left.role === "admin" ? -1 : 1;
        }
        return new Date(right.created_at) - new Date(left.created_at);
      });
  }
};

const journeyRepository = {
  async findVerificationMatch(payload) {
    const row = state.passengerJourneys.find((journey) => {
      const seat = findSeat(journey.assigned_seat_id);
      const trip = findJourney(journey.journey_id);
      return (
        toComparable(trip.journey_type) === toComparable(payload.journeyType) &&
        toComparable(journey.pnr_or_ticket_ref) === toComparable(payload.reference) &&
        toComparable(journey.passenger_name) === toComparable(payload.passengerName) &&
        trip.journey_date === payload.journeyDate &&
        toComparable(trip.coach_or_bus_number) === toComparable(payload.coachOrBusNumber) &&
        toComparable(seat.seat_number) === toComparable(payload.seatNumber) &&
        toComparable(journey.boarding_point) === toComparable(payload.boardingPoint) &&
        toComparable(journey.drop_point) === toComparable(payload.destinationPoint)
      );
    });
    if (!row) {
      return null;
    }
    const journey = findJourney(row.journey_id);
    const seat = findSeat(row.assigned_seat_id);
    return {
      passenger_journey_id: row.id,
      user_id: row.user_id,
      verified: row.verified,
      pnr_or_ticket_ref: row.pnr_or_ticket_ref,
      passenger_name: row.passenger_name,
      boarding_point: row.boarding_point,
      drop_point: row.drop_point,
      journey_id: journey.id,
      journey_type: journey.journey_type,
      journey_code: journey.journey_code,
      journey_date: journey.journey_date,
      coach_or_bus_number: journey.coach_or_bus_number,
      origin: journey.origin,
      destination: journey.destination,
      seat_id: seat.id,
      seat_number: seat.seat_number
    };
  },
  async attachUserAndVerify(passengerJourneyId, userId) {
    const row = findPassengerJourney(passengerJourneyId);
    if (!row) {
      return null;
    }
    row.user_id = Number(userId);
    row.verified = true;
    row.verified_at = timestamp();
    row.updated_at = timestamp();
    return { id: row.id };
  },
  async getPassengerJourneyById(passengerJourneyId) {
    return hydratePassengerJourneyRow(findPassengerJourney(passengerJourneyId));
  },
  async getLatestVerifiedJourneyByUser(userId) {
    const row = state.passengerJourneys
      .filter((journey) => Number(journey.user_id) === Number(userId) && journey.verified)
      .sort((left, right) => new Date(right.verified_at || right.updated_at) - new Date(left.verified_at || left.updated_at))[0];
    return hydratePassengerJourneyRow(row || null);
  },
  async getPassengerJourneyByUserAndJourney(userId, journeyId) {
    const row = state.passengerJourneys.find(
      (journey) =>
        Number(journey.user_id) === Number(userId) &&
        Number(journey.journey_id) === Number(journeyId) &&
        journey.verified
    );
    return hydratePassengerJourneyRow(row || null);
  },
  async getJourneyById(journeyId) {
    return findJourney(journeyId);
  },
  async getSeatMapRows(journeyId) {
    return state.seats
      .filter((seat) => Number(seat.journey_id) === Number(journeyId))
      .sort((left, right) => (left.layout_y - right.layout_y) || (left.layout_x - right.layout_x) || left.seat_number.localeCompare(right.seat_number))
      .map(hydrateSeatRow);
  },
  async listJourneys(filters = {}) {
    return state.journeys
      .filter((journey) => {
        if (filters.journeyType && journey.journey_type !== filters.journeyType) {
          return false;
        }
        if (filters.coachOrBusNumber && !includesText(journey.coach_or_bus_number, filters.coachOrBusNumber)) {
          return false;
        }
        if (filters.journeyCode && !includesText(journey.journey_code, filters.journeyCode)) {
          return false;
        }
        return true;
      })
      .map((journey) => ({
        ...journey,
        seat_count: state.seats.filter((seat) => Number(seat.journey_id) === Number(journey.id)).length,
        passenger_count: state.passengerJourneys.filter((row) => Number(row.journey_id) === Number(journey.id)).length,
        verified_passenger_count: state.passengerJourneys.filter((row) => Number(row.journey_id) === Number(journey.id) && row.verified).length,
        active_swap_count: state.swapRequests.filter((row) => Number(row.journey_id) === Number(journey.id) && ["pending", "accepted"].includes(row.status)).length,
        completed_swap_count: state.swapRequests.filter((row) => Number(row.journey_id) === Number(journey.id) && row.status === "completed").length
      }))
      .sort((left, right) => (left.journey_date < right.journey_date ? 1 : -1) || left.journey_code.localeCompare(right.journey_code));
  },
  async listSeats(filters = {}) {
    return state.seats
      .filter((seat) => {
        if (filters.journeyId && Number(seat.journey_id) !== Number(filters.journeyId)) {
          return false;
        }
        if (filters.coachOrBusNumber && !includesText(seat.coach_or_bus_number, filters.coachOrBusNumber)) {
          return false;
        }
        return true;
      })
      .map(hydrateSeatRow)
      .sort((left, right) => (left.journey_date < right.journey_date ? 1 : -1) || left.coach_or_bus_number.localeCompare(right.coach_or_bus_number) || left.seat_number.localeCompare(right.seat_number));
  },
  async setSeatLock(seatId, isLocked) {
    const seat = findSeat(seatId);
    if (!seat) {
      return null;
    }
    seat.is_locked = isLocked;
    seat.updated_at = timestamp();
    return { id: seat.id, journey_id: seat.journey_id, coach_or_bus_number: seat.coach_or_bus_number, seat_number: seat.seat_number, seat_type: seat.seat_type, is_locked: seat.is_locked };
  }
};

const swapRepository = {
  async findSeatById(seatId) {
    const seat = findSeat(seatId);
    return seat ? hydrateSeatRow(seat) : null;
  },
  async getActiveSeatRequests(journeyId, statuses) {
    return state.swapRequests.filter((swap) => Number(swap.journey_id) === Number(journeyId) && statuses.includes(swap.status)).map((swap) => ({ id: swap.id, status: swap.status, from_seat_id: swap.from_seat_id, to_seat_id: swap.to_seat_id, from_passenger_journey_id: swap.from_passenger_journey_id, to_passenger_journey_id: swap.to_passenger_journey_id }));
  },
  async findSeatConflicts(journeyId, seatIds, statuses) {
    return state.swapRequests.filter((swap) => Number(swap.journey_id) === Number(journeyId) && statuses.includes(swap.status) && (seatIds.includes(Number(swap.from_seat_id)) || seatIds.includes(Number(swap.to_seat_id)))).map((swap) => ({ id: swap.id, status: swap.status, from_seat_id: swap.from_seat_id, to_seat_id: swap.to_seat_id }));
  },
  async createSwapRequest(payload) {
    const row = {
      id: nextIds.swap += 1,
      journey_id: payload.journeyId,
      from_passenger_journey_id: payload.fromPassengerJourneyId,
      to_passenger_journey_id: payload.toPassengerJourneyId,
      from_seat_id: payload.fromSeatId,
      to_seat_id: payload.toSeatId,
      message: payload.message || null,
      status: payload.status,
      requester_final_confirmed: false,
      receiver_final_confirmed: false,
      expires_at: payload.expiresAt.toISOString ? payload.expiresAt.toISOString() : payload.expiresAt,
      created_at: timestamp(),
      updated_at: timestamp()
    };
    state.swapRequests.push(row);
    return { id: row.id };
  },
  async getSwapById(swapId) {
    return hydrateSwapRow(findSwap(swapId));
  },
  async listIncomingByUser(userId, journeyId) {
    return state.swapRequests.filter((swap) => {
      const receiver = findPassengerJourney(swap.to_passenger_journey_id);
      return receiver && Number(receiver.user_id) === Number(userId) && (!journeyId || Number(swap.journey_id) === Number(journeyId));
    }).sort((left, right) => new Date(right.created_at) - new Date(left.created_at)).map(hydrateSwapRow);
  },
  async listOutgoingByUser(userId, journeyId) {
    return state.swapRequests.filter((swap) => {
      const requester = findPassengerJourney(swap.from_passenger_journey_id);
      return requester && Number(requester.user_id) === Number(userId) && (!journeyId || Number(swap.journey_id) === Number(journeyId));
    }).sort((left, right) => new Date(right.created_at) - new Date(left.created_at)).map(hydrateSwapRow);
  },
  async updateStatus(swapId, status) {
    const swap = findSwap(swapId);
    if (!swap) {
      return null;
    }
    swap.status = status;
    swap.updated_at = timestamp();
    return { id: swap.id };
  },
  async markRequesterConfirmed(swapId) {
    const swap = findSwap(swapId);
    if (!swap) {
      return null;
    }
    swap.requester_final_confirmed = true;
    swap.updated_at = timestamp();
    return { id: swap.id };
  },
  async markReceiverConfirmed(swapId) {
    const swap = findSwap(swapId);
    if (!swap) {
      return null;
    }
    swap.receiver_final_confirmed = true;
    swap.updated_at = timestamp();
    return { id: swap.id };
  },
  async completeSwap(request) {
    const requesterJourney = findPassengerJourney(request.from_passenger_journey_id);
    const receiverJourney = findPassengerJourney(request.to_passenger_journey_id);
    const swap = findSwap(request.id);
    requesterJourney.assigned_seat_id = Number(request.to_seat_id);
    requesterJourney.updated_at = timestamp();
    receiverJourney.assigned_seat_id = Number(request.from_seat_id);
    receiverJourney.updated_at = timestamp();
    swap.status = "completed";
    swap.updated_at = timestamp();
    syncSeatOccupants();
  },
  async expireActiveRequests(cutoff, statuses) {
    const cutoffTime = new Date(cutoff).getTime();
    const expired = [];
    for (const swap of state.swapRequests) {
      if (!statuses.includes(swap.status) || new Date(swap.expires_at).getTime() >= cutoffTime) {
        continue;
      }
      swap.status = "expired";
      swap.updated_at = timestamp();
      const requester = findPassengerJourney(swap.from_passenger_journey_id);
      const receiver = findPassengerJourney(swap.to_passenger_journey_id);
      expired.push({ id: swap.id, journey_id: swap.journey_id, requester_user_id: requester ? requester.user_id : null, receiver_user_id: receiver ? receiver.user_id : null });
    }
    return expired;
  },
  async listSwaps(filters = {}) {
    return state.swapRequests.filter((swap) => {
      const journey = findJourney(swap.journey_id);
      if (filters.status && swap.status !== filters.status) {
        return false;
      }
      if (filters.journeyId && Number(swap.journey_id) !== Number(filters.journeyId)) {
        return false;
      }
      if (filters.coachOrBusNumber && !includesText(journey.coach_or_bus_number, filters.coachOrBusNumber)) {
        return false;
      }
      return true;
    }).sort((left, right) => new Date(right.created_at) - new Date(left.created_at)).map((swap) => {
      const row = hydrateSwapRow(swap);
      return { id: row.id, status: row.status, message: row.message, requester_final_confirmed: row.requester_final_confirmed, receiver_final_confirmed: row.receiver_final_confirmed, expires_at: row.expires_at, created_at: row.created_at, journey_id: row.journey_id, journey_type: row.journey_type, journey_code: row.journey_code, journey_date: row.journey_date, coach_or_bus_number: row.coach_or_bus_number, requester_name: row.requester_name, receiver_name: row.receiver_name, from_seat_number: row.from_seat_number, to_seat_number: row.to_seat_number };
    });
  },
  async getAnalytics() {
    return {
      total_journeys: state.journeys.length,
      total_users: state.users.length,
      total_seats: state.seats.length,
      total_swap_requests: state.swapRequests.length,
      completed_swaps: state.swapRequests.filter((swap) => swap.status === "completed").length,
      pending_requests: state.swapRequests.filter((swap) => ["pending", "accepted"].includes(swap.status)).length
    };
  }
};

const notificationRepository = {
  async createNotification(notification) {
    const row = { id: nextIds.notification += 1, user_id: Number(notification.userId), type: notification.type, title: notification.title, body: notification.body, is_read: false, meta_json: notification.meta || {}, created_at: timestamp() };
    state.notifications.push(row);
    return { ...row };
  },
  async createNotifications(notifications) {
    const created = [];
    for (const notification of notifications) {
      created.push(await this.createNotification(notification));
    }
    return created;
  },
  async listByUser(userId) {
    return state.notifications.filter((notification) => Number(notification.user_id) === Number(userId)).sort((left, right) => new Date(right.created_at) - new Date(left.created_at)).slice(0, 100).map((notification) => ({ ...notification }));
  },
  async markRead(userId, notificationId) {
    const row = state.notifications.find((notification) => Number(notification.id) === Number(notificationId) && Number(notification.user_id) === Number(userId));
    if (!row) {
      return null;
    }
    row.is_read = true;
    return { ...row };
  }
};

const auditRepository = {
  async logAction(entry) {
    state.auditLogs.push({ id: nextIds.audit += 1, actor_user_id: entry.actorUserId || null, action: entry.action, entity_type: entry.entityType, entity_id: entry.entityId, details_json: entry.details || {}, created_at: timestamp() });
  }
};

async function transactionRunner(handler) {
  return handler(null);
}

module.exports = {
  auditRepository,
  journeyRepository,
  notificationRepository,
  swapRepository,
  transactionRunner,
  userRepository
};
