const bcrypt = require("bcrypt");
const { pool } = require("../config/db");

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

async function insertUser(client, user, passwordHash) {
  const result = await client.query(
    `
      INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, email, role
    `,
    [user.name, user.email, passwordHash, user.role || "passenger"]
  );

  return result.rows[0];
}

async function insertJourney(client, journey) {
  const result = await client.query(
    `
      INSERT INTO journeys (
        journey_type,
        journey_code,
        journey_date,
        coach_or_bus_number,
        origin,
        destination,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, journey_type, journey_code, coach_or_bus_number
    `,
    [
      journey.journeyType,
      journey.journeyCode,
      journey.journeyDate,
      journey.coachOrBusNumber,
      journey.origin,
      journey.destination
    ]
  );

  return result.rows[0];
}

async function insertSeats(client, journeyId, coachOrBusNumber, layout) {
  const seatMap = {};

  for (const seat of layout) {
    const result = await client.query(
      `
        INSERT INTO seats (
          journey_id,
          coach_or_bus_number,
          seat_number,
          seat_type,
          layout_x,
          layout_y,
          is_window,
          is_aisle,
          is_locked,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NOW(), NOW())
        RETURNING id, seat_number
      `,
      [
        journeyId,
        coachOrBusNumber,
        seat.seatNumber,
        seat.seatType,
        seat.layoutX,
        seat.layoutY,
        seat.isWindow,
        seat.isAisle
      ]
    );

    seatMap[result.rows[0].seat_number] = result.rows[0].id;
  }

  return seatMap;
}

async function insertPassengerJourney(client, record) {
  const result = await client.query(
    `
      INSERT INTO passenger_journeys (
        user_id,
        journey_id,
        pnr_or_ticket_ref,
        passenger_name,
        assigned_seat_id,
        original_assigned_seat_id,
        boarding_point,
        drop_point,
        verified,
        verified_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id
    `,
    [
      record.userId || null,
      record.journeyId,
      record.reference,
      record.passengerName,
      record.assignedSeatId,
      record.originalSeatId,
      record.boardingPoint,
      record.destinationPoint,
      record.verified,
      record.verifiedAt || null
    ]
  );

  return result.rows[0].id;
}

async function setSeatOccupant(client, seatId, passengerJourneyId) {
  await client.query(
    `
      UPDATE seats
      SET current_passenger_journey_id = $2,
          updated_at = NOW()
      WHERE id = $1
    `,
    [seatId, passengerJourneyId]
  );
}

async function insertSwap(client, swap) {
  const result = await client.query(
    `
      INSERT INTO swap_requests (
        journey_id,
        from_passenger_journey_id,
        to_passenger_journey_id,
        from_seat_id,
        to_seat_id,
        message,
        status,
        requester_final_confirmed,
        receiver_final_confirmed,
        expires_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id
    `,
    [
      swap.journeyId,
      swap.fromPassengerJourneyId,
      swap.toPassengerJourneyId,
      swap.fromSeatId,
      swap.toSeatId,
      swap.message,
      swap.status,
      swap.requesterFinalConfirmed || false,
      swap.receiverFinalConfirmed || false,
      swap.expiresAt
    ]
  );

  return result.rows[0].id;
}

async function insertNotification(client, notification) {
  await client.query(
    `
      INSERT INTO notifications (user_id, type, title, body, is_read, meta_json, created_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
    `,
    [
      notification.userId,
      notification.type,
      notification.title,
      notification.body,
      notification.isRead || false,
      JSON.stringify(notification.meta || {})
    ]
  );
}

async function insertAudit(client, log) {
  await client.query(
    `
      INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details_json, created_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
    `,
    [
      log.actorUserId || null,
      log.action,
      log.entityType,
      log.entityId,
      JSON.stringify(log.details || {})
    ]
  );
}

async function run() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `
        TRUNCATE TABLE
          audit_logs,
          notifications,
          swap_requests,
          seats,
          passenger_journeys,
          journeys,
          users
        RESTART IDENTITY CASCADE
      `
    );

    const sharedPasswordHash = await bcrypt.hash("Travel@123", 10);
    const adminPasswordHash = await bcrypt.hash("Admin@123", 10);

    const users = {};
    const userList = [
      { key: "admin", name: "SeatSync Admin", email: "admin@seatsync.dev", role: "admin" },
      { key: "arjun", name: "Arjun Mehta", email: "arjun@seatsync.dev" },
      { key: "meera", name: "Meera Nair", email: "meera@seatsync.dev" },
      { key: "nikhil", name: "Nikhil Rao", email: "nikhil@seatsync.dev" },
      { key: "rohan", name: "Rohan Patel", email: "rohan@seatsync.dev" },
      { key: "priya", name: "Priya Sen", email: "priya@seatsync.dev" },
      { key: "farah", name: "Farah Khan", email: "farah@seatsync.dev" },
      { key: "sameer", name: "Sameer Das", email: "sameer@seatsync.dev" },
      { key: "leena", name: "Leena Thomas", email: "leena@seatsync.dev" },
      { key: "aman", name: "Aman Gill", email: "aman@seatsync.dev" },
      { key: "sara", name: "Sara Qureshi", email: "sara@seatsync.dev" },
      { key: "kabir", name: "Kabir Anand", email: "kabir@seatsync.dev" }
    ];

    for (const user of userList) {
      users[user.key] = await insertUser(
        client,
        user,
        user.role === "admin" ? adminPasswordHash : sharedPasswordHash
      );
    }

    const journeys = {};
    const journeyList = [
      {
        key: "trainDelhi",
        journeyType: "train",
        journeyCode: "12901 Rajdhani Express",
        journeyDate: "2026-04-22",
        coachOrBusNumber: "S1",
        origin: "New Delhi",
        destination: "Bhopal",
        layout: buildFourAcrossLayout(8)
      },
      {
        key: "trainMumbai",
        journeyType: "train",
        journeyCode: "12025 Shatabdi",
        journeyDate: "2026-04-23",
        coachOrBusNumber: "C2",
        origin: "Mumbai Central",
        destination: "Vadodara",
        layout: buildFourAcrossLayout(6)
      },
      {
        key: "busBangalore",
        journeyType: "bus",
        journeyCode: "KA-09 NightLiner",
        journeyDate: "2026-04-24",
        coachOrBusNumber: "B7",
        origin: "Indiranagar",
        destination: "Electronic City",
        layout: buildFourAcrossLayout(6)
      },
      {
        key: "busChennai",
        journeyType: "bus",
        journeyCode: "TN-Express 77",
        journeyDate: "2026-04-25",
        coachOrBusNumber: "A1",
        origin: "Chennai Central",
        destination: "Tambaram",
        layout: buildFourAcrossLayout(6)
      }
    ];

    const seatMaps = {};

    for (const journey of journeyList) {
      journeys[journey.key] = await insertJourney(client, journey);
      seatMaps[journey.key] = await insertSeats(
        client,
        journeys[journey.key].id,
        journey.coachOrBusNumber,
        journey.layout
      );
    }

    const passengers = {};
    const now = Date.now();
    const verifiedAt = (offsetHours) => new Date(now - offsetHours * 60 * 60 * 1000);

    const passengerDefinitions = [
      {
        key: "arjunDelhi",
        userId: users.arjun.id,
        journeyId: journeys.trainDelhi.id,
        reference: "PNR-410001",
        passengerName: "Arjun Mehta",
        originalSeatId: seatMaps.trainDelhi["1A"],
        assignedSeatId: seatMaps.trainDelhi["1A"],
        boardingPoint: "New Delhi",
        destinationPoint: "Bhopal",
        verified: true,
        verifiedAt: verifiedAt(48)
      },
      {
        key: "meeraDelhi",
        userId: users.meera.id,
        journeyId: journeys.trainDelhi.id,
        reference: "PNR-410002",
        passengerName: "Meera Nair",
        originalSeatId: seatMaps.trainDelhi["1D"],
        assignedSeatId: seatMaps.trainDelhi["1D"],
        boardingPoint: "New Delhi",
        destinationPoint: "Bhopal",
        verified: true,
        verifiedAt: verifiedAt(47)
      },
      {
        key: "nikhilDelhi",
        userId: users.nikhil.id,
        journeyId: journeys.trainDelhi.id,
        reference: "PNR-410003",
        passengerName: "Nikhil Rao",
        originalSeatId: seatMaps.trainDelhi["2B"],
        assignedSeatId: seatMaps.trainDelhi["4A"],
        boardingPoint: "New Delhi",
        destinationPoint: "Bhopal",
        verified: true,
        verifiedAt: verifiedAt(46)
      },
      {
        key: "rohanDelhi",
        userId: users.rohan.id,
        journeyId: journeys.trainDelhi.id,
        reference: "PNR-410004",
        passengerName: "Rohan Patel",
        originalSeatId: seatMaps.trainDelhi["4A"],
        assignedSeatId: seatMaps.trainDelhi["2B"],
        boardingPoint: "New Delhi",
        destinationPoint: "Bhopal",
        verified: true,
        verifiedAt: verifiedAt(45)
      },
      {
        key: "priyaDelhi",
        userId: users.priya.id,
        journeyId: journeys.trainDelhi.id,
        reference: "PNR-410005",
        passengerName: "Priya Sen",
        originalSeatId: seatMaps.trainDelhi["3C"],
        assignedSeatId: seatMaps.trainDelhi["3C"],
        boardingPoint: "New Delhi",
        destinationPoint: "Bhopal",
        verified: true,
        verifiedAt: verifiedAt(44)
      },
      {
        key: "ishaanDelhi",
        journeyId: journeys.trainDelhi.id,
        reference: "PNR-900111",
        passengerName: "Ishaan Kapoor",
        originalSeatId: seatMaps.trainDelhi["5D"],
        assignedSeatId: seatMaps.trainDelhi["5D"],
        boardingPoint: "New Delhi",
        destinationPoint: "Bhopal",
        verified: false
      },
      {
        key: "kavyaDelhi",
        journeyId: journeys.trainDelhi.id,
        reference: "PNR-900112",
        passengerName: "Kavya Iyer",
        originalSeatId: seatMaps.trainDelhi["6A"],
        assignedSeatId: seatMaps.trainDelhi["6A"],
        boardingPoint: "New Delhi",
        destinationPoint: "Bhopal",
        verified: false
      },
      {
        key: "farahMumbai",
        userId: users.farah.id,
        journeyId: journeys.trainMumbai.id,
        reference: "TKT-220601",
        passengerName: "Farah Khan",
        originalSeatId: seatMaps.trainMumbai["1A"],
        assignedSeatId: seatMaps.trainMumbai["1A"],
        boardingPoint: "Mumbai Central",
        destinationPoint: "Vadodara",
        verified: true,
        verifiedAt: verifiedAt(36)
      },
      {
        key: "sameerMumbai",
        userId: users.sameer.id,
        journeyId: journeys.trainMumbai.id,
        reference: "TKT-220602",
        passengerName: "Sameer Das",
        originalSeatId: seatMaps.trainMumbai["2D"],
        assignedSeatId: seatMaps.trainMumbai["2D"],
        boardingPoint: "Mumbai Central",
        destinationPoint: "Vadodara",
        verified: true,
        verifiedAt: verifiedAt(35)
      },
      {
        key: "ananyaMumbai",
        journeyId: journeys.trainMumbai.id,
        reference: "TKT-220701",
        passengerName: "Ananya Roy",
        originalSeatId: seatMaps.trainMumbai["3A"],
        assignedSeatId: seatMaps.trainMumbai["3A"],
        boardingPoint: "Mumbai Central",
        destinationPoint: "Vadodara",
        verified: false
      },
      {
        key: "devMumbai",
        journeyId: journeys.trainMumbai.id,
        reference: "TKT-220702",
        passengerName: "Dev Malhotra",
        originalSeatId: seatMaps.trainMumbai["4C"],
        assignedSeatId: seatMaps.trainMumbai["4C"],
        boardingPoint: "Mumbai Central",
        destinationPoint: "Vadodara",
        verified: false
      },
      {
        key: "leenaBangalore",
        userId: users.leena.id,
        journeyId: journeys.busBangalore.id,
        reference: "BUS-884301",
        passengerName: "Leena Thomas",
        originalSeatId: seatMaps.busBangalore["1A"],
        assignedSeatId: seatMaps.busBangalore["1A"],
        boardingPoint: "Indiranagar",
        destinationPoint: "Electronic City",
        verified: true,
        verifiedAt: verifiedAt(24)
      },
      {
        key: "amanBangalore",
        userId: users.aman.id,
        journeyId: journeys.busBangalore.id,
        reference: "BUS-884302",
        passengerName: "Aman Gill",
        originalSeatId: seatMaps.busBangalore["1D"],
        assignedSeatId: seatMaps.busBangalore["1D"],
        boardingPoint: "Indiranagar",
        destinationPoint: "Electronic City",
        verified: true,
        verifiedAt: verifiedAt(23)
      },
      {
        key: "rahulBangalore",
        journeyId: journeys.busBangalore.id,
        reference: "BUS-884401",
        passengerName: "Rahul Verma",
        originalSeatId: seatMaps.busBangalore["2A"],
        assignedSeatId: seatMaps.busBangalore["2A"],
        boardingPoint: "Indiranagar",
        destinationPoint: "Electronic City",
        verified: false
      },
      {
        key: "snehaBangalore",
        journeyId: journeys.busBangalore.id,
        reference: "BUS-884402",
        passengerName: "Sneha Joshi",
        originalSeatId: seatMaps.busBangalore["2D"],
        assignedSeatId: seatMaps.busBangalore["2D"],
        boardingPoint: "Indiranagar",
        destinationPoint: "Electronic City",
        verified: false
      },
      {
        key: "saraChennai",
        userId: users.sara.id,
        journeyId: journeys.busChennai.id,
        reference: "BUS-990401",
        passengerName: "Sara Qureshi",
        originalSeatId: seatMaps.busChennai["2A"],
        assignedSeatId: seatMaps.busChennai["2A"],
        boardingPoint: "Chennai Central",
        destinationPoint: "Tambaram",
        verified: true,
        verifiedAt: verifiedAt(12)
      },
      {
        key: "kabirChennai",
        userId: users.kabir.id,
        journeyId: journeys.busChennai.id,
        reference: "BUS-990402",
        passengerName: "Kabir Anand",
        originalSeatId: seatMaps.busChennai["3D"],
        assignedSeatId: seatMaps.busChennai["3D"],
        boardingPoint: "Chennai Central",
        destinationPoint: "Tambaram",
        verified: true,
        verifiedAt: verifiedAt(11)
      },
      {
        key: "nehaChennai",
        journeyId: journeys.busChennai.id,
        reference: "BUS-990501",
        passengerName: "Neha Arora",
        originalSeatId: seatMaps.busChennai["4B"],
        assignedSeatId: seatMaps.busChennai["4B"],
        boardingPoint: "Chennai Central",
        destinationPoint: "Tambaram",
        verified: false
      },
      {
        key: "vikramChennai",
        journeyId: journeys.busChennai.id,
        reference: "BUS-990502",
        passengerName: "Vikram Sethi",
        originalSeatId: seatMaps.busChennai["5C"],
        assignedSeatId: seatMaps.busChennai["5C"],
        boardingPoint: "Chennai Central",
        destinationPoint: "Tambaram",
        verified: false
      }
    ];

    for (const passenger of passengerDefinitions) {
      passengers[passenger.key] = await insertPassengerJourney(client, passenger);
    }

    for (const passenger of passengerDefinitions) {
      await setSeatOccupant(client, passenger.assignedSeatId, passengers[passenger.key]);
    }

    const completedSwapId = await insertSwap(client, {
      journeyId: journeys.trainDelhi.id,
      fromPassengerJourneyId: passengers.nikhilDelhi,
      toPassengerJourneyId: passengers.rohanDelhi,
      fromSeatId: seatMaps.trainDelhi["2B"],
      toSeatId: seatMaps.trainDelhi["4A"],
      message: "Completed exchange for a quieter lower berth area.",
      status: "completed",
      requesterFinalConfirmed: true,
      receiverFinalConfirmed: true,
      expiresAt: new Date(now - 3 * 60 * 60 * 1000)
    });

    const acceptedSwapId = await insertSwap(client, {
      journeyId: journeys.trainDelhi.id,
      fromPassengerJourneyId: passengers.arjunDelhi,
      toPassengerJourneyId: passengers.meeraDelhi,
      fromSeatId: seatMaps.trainDelhi["1A"],
      toSeatId: seatMaps.trainDelhi["1D"],
      message: "Window for aisle if you would prefer quicker access.",
      status: "accepted",
      requesterFinalConfirmed: false,
      receiverFinalConfirmed: false,
      expiresAt: new Date(now + 35 * 60 * 1000)
    });

    const rejectedSwapId = await insertSwap(client, {
      journeyId: journeys.trainMumbai.id,
      fromPassengerJourneyId: passengers.farahMumbai,
      toPassengerJourneyId: passengers.sameerMumbai,
      fromSeatId: seatMaps.trainMumbai["1A"],
      toSeatId: seatMaps.trainMumbai["2D"],
      message: "Would you like to trade for a window seat?",
      status: "rejected",
      requesterFinalConfirmed: false,
      receiverFinalConfirmed: false,
      expiresAt: new Date(now - 2 * 60 * 60 * 1000)
    });

    const pendingSwapId = await insertSwap(client, {
      journeyId: journeys.busBangalore.id,
      fromPassengerJourneyId: passengers.leenaBangalore,
      toPassengerJourneyId: passengers.amanBangalore,
      fromSeatId: seatMaps.busBangalore["1A"],
      toSeatId: seatMaps.busBangalore["1D"],
      message: "I am travelling with luggage and would prefer the door-side seat.",
      status: "pending",
      requesterFinalConfirmed: false,
      receiverFinalConfirmed: false,
      expiresAt: new Date(now + 50 * 60 * 1000)
    });

    const cancelledSwapId = await insertSwap(client, {
      journeyId: journeys.busChennai.id,
      fromPassengerJourneyId: passengers.saraChennai,
      toPassengerJourneyId: passengers.kabirChennai,
      fromSeatId: seatMaps.busChennai["2A"],
      toSeatId: seatMaps.busChennai["3D"],
      message: "Checking if you want to switch for easier exit access.",
      status: "cancelled",
      requesterFinalConfirmed: false,
      receiverFinalConfirmed: false,
      expiresAt: new Date(now - 90 * 60 * 1000)
    });

    const notificationSeed = [
      {
        userId: users.arjun.id,
        type: "swap_confirmation_pending",
        title: "Final confirmation pending",
        body: "Meera accepted your seat swap. Both passengers must confirm to complete it.",
        meta: { swapRequestId: acceptedSwapId, journeyId: journeys.trainDelhi.id }
      },
      {
        userId: users.meera.id,
        type: "swap_request_accepted",
        title: "Swap accepted",
        body: "Your journey is waiting on final digital consent from both sides.",
        meta: { swapRequestId: acceptedSwapId, journeyId: journeys.trainDelhi.id }
      },
      {
        userId: users.nikhil.id,
        type: "swap_completed",
        title: "Seat swap completed",
        body: "Your completed exchange is reflected on the live coach map.",
        meta: { swapRequestId: completedSwapId, journeyId: journeys.trainDelhi.id }
      },
      {
        userId: users.rohan.id,
        type: "swap_completed",
        title: "Seat swap completed",
        body: "Your updated seat assignment is live for this journey.",
        meta: { swapRequestId: completedSwapId, journeyId: journeys.trainDelhi.id }
      },
      {
        userId: users.farah.id,
        type: "swap_request_rejected",
        title: "Swap rejected",
        body: "Sameer declined your exchange request on the Mumbai route.",
        meta: { swapRequestId: rejectedSwapId, journeyId: journeys.trainMumbai.id }
      },
      {
        userId: users.aman.id,
        type: "swap_request_new",
        title: "New seat swap request",
        body: "Leena sent you a live seat swap request.",
        meta: { swapRequestId: pendingSwapId, journeyId: journeys.busBangalore.id }
      },
      {
        userId: users.sara.id,
        type: "swap_request_cancelled",
        title: "Request cancelled",
        body: "Your earlier request on the Chennai route was cancelled.",
        meta: { swapRequestId: cancelledSwapId, journeyId: journeys.busChennai.id }
      }
    ];

    for (const notification of notificationSeed) {
      await insertNotification(client, notification);
    }

    const auditSeed = [
      {
        actorUserId: users.arjun.id,
        action: "journey_verified",
        entityType: "passenger_journey",
        entityId: passengers.arjunDelhi,
        details: { journeyId: journeys.trainDelhi.id }
      },
      {
        actorUserId: users.nikhil.id,
        action: "swap_request_completed",
        entityType: "swap_request",
        entityId: completedSwapId,
        details: { journeyId: journeys.trainDelhi.id }
      },
      {
        actorUserId: users.meera.id,
        action: "swap_request_accepted",
        entityType: "swap_request",
        entityId: acceptedSwapId,
        details: { journeyId: journeys.trainDelhi.id }
      },
      {
        actorUserId: users.farah.id,
        action: "swap_request_rejected",
        entityType: "swap_request",
        entityId: rejectedSwapId,
        details: { journeyId: journeys.trainMumbai.id }
      }
    ];

    for (const log of auditSeed) {
      await insertAudit(client, log);
    }

    await client.query("COMMIT");

    console.log("SeatSync seed completed.");
    console.log("Admin login: admin@seatsync.dev / Admin@123");
    console.log("Passenger login: arjun@seatsync.dev / Travel@123");
    console.log("Claimable verification sample: PNR-900111 / Ishaan Kapoor / 2026-04-22 / S1 / 5D");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Failed to seed SeatSync.", error);
  process.exitCode = 1;
});
