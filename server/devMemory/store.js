const bcrypt = require("bcrypt");

function buildFourAcrossLayout(rows) {
  const columns = [
    { letter: "A", x: 1, seatType: "window", isWindow: true, isAisle: false },
    { letter: "B", x: 2, seatType: "aisle", isWindow: false, isAisle: true },
    { letter: "C", x: 4, seatType: "aisle", isWindow: false, isAisle: true },
    { letter: "D", x: 5, seatType: "window", isWindow: true, isAisle: false }
  ];
  const seats = [];

  for (let row = 1; row <= rows; row += 1) {
    for (const column of columns) {
      seats.push({
        seatNumber: `${row}${column.letter}`,
        seatType: column.seatType,
        layoutX: column.x,
        layoutY: row,
        isWindow: column.isWindow,
        isAisle: column.isAisle
      });
    }
  }

  return seats;
}

function createStore() {
  const baseTime = new Date("2026-03-19T03:00:00.000Z").getTime();
  const nextIds = {
    user: 1,
    journey: 1,
    seat: 1,
    passengerJourney: 1,
    swap: 1,
    notification: 1,
    audit: 1
  };
  const state = {
    users: [],
    journeys: [],
    seats: [],
    passengerJourneys: [],
    swapRequests: [],
    notifications: [],
    auditLogs: []
  };
  const refs = {
    users: {},
    journeys: {},
    seats: {},
    passengerJourneys: {}
  };

  const travelPasswordHash = bcrypt.hashSync("Travel@123", 10);
  const adminPasswordHash = bcrypt.hashSync("Admin@123", 10);

  function timestamp(minutesAgo = 0) {
    return new Date(baseTime - minutesAgo * 60 * 1000).toISOString();
  }

  function addUser(key, name, email, role, passwordHash) {
    const row = {
      id: nextIds.user += 1,
      name,
      email,
      role,
      password_hash: passwordHash,
      created_at: timestamp(600 + nextIds.user),
      updated_at: timestamp(600 + nextIds.user)
    };
    state.users.push(row);
    refs.users[key] = row;
    return row;
  }

  function addJourney(key, journeyType, journeyCode, journeyDate, coachOrBusNumber, origin, destination, rows) {
    const row = {
      id: nextIds.journey += 1,
      journey_type: journeyType,
      journey_code: journeyCode,
      journey_date: journeyDate,
      coach_or_bus_number: coachOrBusNumber,
      origin,
      destination,
      created_at: timestamp(400 + nextIds.journey),
      updated_at: timestamp(400 + nextIds.journey)
    };
    state.journeys.push(row);
    refs.journeys[key] = row;
    refs.seats[key] = {};

    for (const seat of buildFourAcrossLayout(rows)) {
      const seatRow = {
        id: nextIds.seat += 1,
        journey_id: row.id,
        coach_or_bus_number: coachOrBusNumber,
        seat_number: seat.seatNumber,
        seat_type: seat.seatType,
        layout_x: seat.layoutX,
        layout_y: seat.layoutY,
        is_window: seat.isWindow,
        is_aisle: seat.isAisle,
        is_locked: false,
        current_passenger_journey_id: null,
        created_at: timestamp(300 + nextIds.seat),
        updated_at: timestamp(300 + nextIds.seat)
      };
      state.seats.push(seatRow);
      refs.seats[key][seat.seatNumber] = seatRow.id;
    }

    return row;
  }

  function addPassengerJourney(key, userId, journeyId, reference, passengerName, originalSeatId, assignedSeatId, boardingPoint, destinationPoint, verified, verifiedAt) {
    const row = {
      id: nextIds.passengerJourney += 1,
      user_id: userId || null,
      journey_id: journeyId,
      pnr_or_ticket_ref: reference,
      passenger_name: passengerName,
      assigned_seat_id: assignedSeatId,
      original_assigned_seat_id: originalSeatId,
      boarding_point: boardingPoint,
      drop_point: destinationPoint,
      verified,
      verified_at: verifiedAt || null,
      created_at: timestamp(200 + nextIds.passengerJourney),
      updated_at: timestamp(200 + nextIds.passengerJourney)
    };
    state.passengerJourneys.push(row);
    refs.passengerJourneys[key] = row;
    return row;
  }

  function syncSeatOccupants() {
    for (const seat of state.seats) {
      seat.current_passenger_journey_id = null;
    }

    for (const passengerJourney of state.passengerJourneys) {
      const seat = state.seats.find((item) => item.id === passengerJourney.assigned_seat_id);

      if (seat) {
        seat.current_passenger_journey_id = passengerJourney.id;
      }
    }
  }

  addUser("admin", "SeatSync Admin", "admin@seatsync.dev", "admin", adminPasswordHash);
  addUser("arjun", "Arjun Mehta", "arjun@seatsync.dev", "passenger", travelPasswordHash);
  addUser("meera", "Meera Nair", "meera@seatsync.dev", "passenger", travelPasswordHash);
  addUser("leena", "Leena Thomas", "leena@seatsync.dev", "passenger", travelPasswordHash);
  addUser("aman", "Aman Gill", "aman@seatsync.dev", "passenger", travelPasswordHash);

  addJourney("trainDelhi", "train", "12901 Rajdhani Express", "2026-04-22", "S1", "New Delhi", "Bhopal", 8);
  addJourney("busBangalore", "bus", "KA-09 NightLiner", "2026-04-24", "B7", "Indiranagar", "Electronic City", 6);

  addPassengerJourney("arjunDelhi", refs.users.arjun.id, refs.journeys.trainDelhi.id, "PNR-410001", "Arjun Mehta", refs.seats.trainDelhi["1A"], refs.seats.trainDelhi["1A"], "New Delhi", "Bhopal", true, timestamp(48 * 60));
  addPassengerJourney("meeraDelhi", refs.users.meera.id, refs.journeys.trainDelhi.id, "PNR-410002", "Meera Nair", refs.seats.trainDelhi["1D"], refs.seats.trainDelhi["1D"], "New Delhi", "Bhopal", true, timestamp(47 * 60));
  addPassengerJourney("ishaanDelhi", null, refs.journeys.trainDelhi.id, "PNR-900111", "Ishaan Kapoor", refs.seats.trainDelhi["5D"], refs.seats.trainDelhi["5D"], "New Delhi", "Bhopal", false, null);
  addPassengerJourney("kavyaDelhi", null, refs.journeys.trainDelhi.id, "PNR-900112", "Kavya Iyer", refs.seats.trainDelhi["6A"], refs.seats.trainDelhi["6A"], "New Delhi", "Bhopal", false, null);
  addPassengerJourney("leenaBus", refs.users.leena.id, refs.journeys.busBangalore.id, "BUS-884301", "Leena Thomas", refs.seats.busBangalore["1A"], refs.seats.busBangalore["1A"], "Indiranagar", "Electronic City", true, timestamp(30 * 60));
  addPassengerJourney("amanBus", refs.users.aman.id, refs.journeys.busBangalore.id, "BUS-884302", "Aman Gill", refs.seats.busBangalore["1D"], refs.seats.busBangalore["1D"], "Indiranagar", "Electronic City", true, timestamp(29 * 60));
  addPassengerJourney("rahulBus", null, refs.journeys.busBangalore.id, "BUS-884401", "Rahul Verma", refs.seats.busBangalore["2A"], refs.seats.busBangalore["2A"], "Indiranagar", "Electronic City", false, null);

  syncSeatOccupants();

  state.swapRequests.push(
    {
      id: nextIds.swap += 1,
      journey_id: refs.journeys.trainDelhi.id,
      from_passenger_journey_id: refs.passengerJourneys.arjunDelhi.id,
      to_passenger_journey_id: refs.passengerJourneys.meeraDelhi.id,
      from_seat_id: refs.seats.trainDelhi["1A"],
      to_seat_id: refs.seats.trainDelhi["1D"],
      message: "Window for aisle if you prefer quicker access.",
      status: "accepted",
      requester_final_confirmed: false,
      receiver_final_confirmed: false,
      expires_at: timestamp(-45),
      created_at: timestamp(90),
      updated_at: timestamp(75)
    },
    {
      id: nextIds.swap += 1,
      journey_id: refs.journeys.busBangalore.id,
      from_passenger_journey_id: refs.passengerJourneys.leenaBus.id,
      to_passenger_journey_id: refs.passengerJourneys.amanBus.id,
      from_seat_id: refs.seats.busBangalore["1A"],
      to_seat_id: refs.seats.busBangalore["1D"],
      message: "Could we switch for easier door access?",
      status: "pending",
      requester_final_confirmed: false,
      receiver_final_confirmed: false,
      expires_at: timestamp(-30),
      created_at: timestamp(60),
      updated_at: timestamp(60)
    }
  );

  state.notifications.push(
    {
      id: nextIds.notification += 1,
      user_id: refs.users.admin.id,
      type: "demo_mode_active",
      title: "Demo mode active",
      body: "SeatSync is using in-memory demo data because PostgreSQL is unavailable locally.",
      is_read: false,
      meta_json: {},
      created_at: timestamp(10)
    },
    {
      id: nextIds.notification += 1,
      user_id: refs.users.arjun.id,
      type: "swap_request_accepted",
      title: "Swap accepted",
      body: "Meera accepted your swap. Final digital consent is pending.",
      is_read: false,
      meta_json: { journeyId: refs.journeys.trainDelhi.id },
      created_at: timestamp(70)
    },
    {
      id: nextIds.notification += 1,
      user_id: refs.users.meera.id,
      type: "swap_confirmation_pending",
      title: "Final confirmation pending",
      body: "Both passengers must confirm to complete the exchange.",
      is_read: false,
      meta_json: { journeyId: refs.journeys.trainDelhi.id },
      created_at: timestamp(69)
    },
    {
      id: nextIds.notification += 1,
      user_id: refs.users.aman.id,
      type: "swap_request_new",
      title: "New seat swap request",
      body: "Leena sent you a swap request for your current bus seat.",
      is_read: false,
      meta_json: { journeyId: refs.journeys.busBangalore.id },
      created_at: timestamp(50)
    }
  );

  return { nextIds, refs, state, timestamp };
}

module.exports = createStore();
