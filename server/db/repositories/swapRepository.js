const { getExecutor } = require("./helpers");

async function findSeatById(seatId, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT
        s.id,
        s.journey_id,
        s.coach_or_bus_number,
        s.seat_number,
        s.seat_type,
        s.is_locked,
        s.current_passenger_journey_id,
        j.journey_type,
        j.journey_code,
        j.journey_date,
        j.origin,
        j.destination,
        pj.id AS passenger_journey_id,
        pj.user_id AS occupant_user_id,
        pj.passenger_name,
        pj.verified AS occupant_verified
      FROM seats s
      INNER JOIN journeys j ON j.id = s.journey_id
      LEFT JOIN passenger_journeys pj ON pj.id = s.current_passenger_journey_id
      WHERE s.id = $1
      LIMIT 1
    `,
    [seatId]
  );

  return result.rows[0] || null;
}

async function getActiveSeatRequests(journeyId, statuses, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT
        id,
        status,
        from_seat_id,
        to_seat_id,
        from_passenger_journey_id,
        to_passenger_journey_id
      FROM swap_requests
      WHERE journey_id = $1
        AND status = ANY($2)
    `,
    [journeyId, statuses]
  );

  return result.rows;
}

async function findSeatConflicts(journeyId, seatIds, statuses, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT id, status, from_seat_id, to_seat_id
      FROM swap_requests
      WHERE journey_id = $1
        AND status = ANY($2)
        AND (from_seat_id = ANY($3) OR to_seat_id = ANY($3))
      ORDER BY created_at DESC
    `,
    [journeyId, statuses, seatIds]
  );

  return result.rows;
}

async function createSwapRequest(payload, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      INSERT INTO swap_requests (
        journey_id,
        from_passenger_journey_id,
        to_passenger_journey_id,
        from_seat_id,
        to_seat_id,
        message,
        status,
        expires_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id
    `,
    [
      payload.journeyId,
      payload.fromPassengerJourneyId,
      payload.toPassengerJourneyId,
      payload.fromSeatId,
      payload.toSeatId,
      payload.message || null,
      payload.status,
      payload.expiresAt
    ]
  );

  return result.rows[0];
}

async function getSwapById(swapId, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT
        sr.id,
        sr.journey_id,
        sr.from_passenger_journey_id,
        sr.to_passenger_journey_id,
        sr.from_seat_id,
        sr.to_seat_id,
        sr.message,
        sr.status,
        sr.requester_final_confirmed,
        sr.receiver_final_confirmed,
        sr.expires_at,
        sr.created_at,
        sr.updated_at,
        j.journey_type,
        j.journey_code,
        j.journey_date,
        j.coach_or_bus_number,
        j.origin,
        j.destination,
        requester.user_id AS requester_user_id,
        requester.passenger_name AS requester_name,
        receiver.user_id AS receiver_user_id,
        receiver.passenger_name AS receiver_name,
        from_seat.seat_number AS from_seat_number,
        from_seat.is_locked AS from_seat_locked,
        to_seat.seat_number AS to_seat_number,
        to_seat.is_locked AS to_seat_locked
      FROM swap_requests sr
      INNER JOIN journeys j ON j.id = sr.journey_id
      INNER JOIN passenger_journeys requester ON requester.id = sr.from_passenger_journey_id
      INNER JOIN passenger_journeys receiver ON receiver.id = sr.to_passenger_journey_id
      INNER JOIN seats from_seat ON from_seat.id = sr.from_seat_id
      INNER JOIN seats to_seat ON to_seat.id = sr.to_seat_id
      WHERE sr.id = $1
      LIMIT 1
    `,
    [swapId]
  );

  return result.rows[0] || null;
}

async function listIncomingByUser(userId, journeyId, executor) {
  const db = getExecutor(executor);
  const values = [userId];
  let journeyClause = "";

  if (journeyId) {
    values.push(journeyId);
    journeyClause = `AND sr.journey_id = $${values.length}`;
  }

  const result = await db.query(
    `
      SELECT
        sr.id,
        sr.journey_id,
        sr.from_passenger_journey_id,
        sr.to_passenger_journey_id,
        sr.from_seat_id,
        sr.to_seat_id,
        sr.message,
        sr.status,
        sr.requester_final_confirmed,
        sr.receiver_final_confirmed,
        sr.expires_at,
        sr.created_at,
        sr.updated_at,
        j.journey_type,
        j.journey_code,
        j.journey_date,
        j.coach_or_bus_number,
        j.origin,
        j.destination,
        requester.user_id AS requester_user_id,
        requester.passenger_name AS requester_name,
        receiver.user_id AS receiver_user_id,
        receiver.passenger_name AS receiver_name,
        from_seat.seat_number AS from_seat_number,
        from_seat.is_locked AS from_seat_locked,
        to_seat.seat_number AS to_seat_number,
        to_seat.is_locked AS to_seat_locked
      FROM swap_requests sr
      INNER JOIN journeys j ON j.id = sr.journey_id
      INNER JOIN passenger_journeys requester ON requester.id = sr.from_passenger_journey_id
      INNER JOIN passenger_journeys receiver ON receiver.id = sr.to_passenger_journey_id
      INNER JOIN seats from_seat ON from_seat.id = sr.from_seat_id
      INNER JOIN seats to_seat ON to_seat.id = sr.to_seat_id
      WHERE receiver.user_id = $1
        ${journeyClause}
      ORDER BY sr.created_at DESC
    `,
    values
  );

  return result.rows;
}

async function listOutgoingByUser(userId, journeyId, executor) {
  const db = getExecutor(executor);
  const values = [userId];
  let journeyClause = "";

  if (journeyId) {
    values.push(journeyId);
    journeyClause = `AND sr.journey_id = $${values.length}`;
  }

  const result = await db.query(
    `
      SELECT
        sr.id,
        sr.journey_id,
        sr.from_passenger_journey_id,
        sr.to_passenger_journey_id,
        sr.from_seat_id,
        sr.to_seat_id,
        sr.message,
        sr.status,
        sr.requester_final_confirmed,
        sr.receiver_final_confirmed,
        sr.expires_at,
        sr.created_at,
        sr.updated_at,
        j.journey_type,
        j.journey_code,
        j.journey_date,
        j.coach_or_bus_number,
        j.origin,
        j.destination,
        requester.user_id AS requester_user_id,
        requester.passenger_name AS requester_name,
        receiver.user_id AS receiver_user_id,
        receiver.passenger_name AS receiver_name,
        from_seat.seat_number AS from_seat_number,
        from_seat.is_locked AS from_seat_locked,
        to_seat.seat_number AS to_seat_number,
        to_seat.is_locked AS to_seat_locked
      FROM swap_requests sr
      INNER JOIN journeys j ON j.id = sr.journey_id
      INNER JOIN passenger_journeys requester ON requester.id = sr.from_passenger_journey_id
      INNER JOIN passenger_journeys receiver ON receiver.id = sr.to_passenger_journey_id
      INNER JOIN seats from_seat ON from_seat.id = sr.from_seat_id
      INNER JOIN seats to_seat ON to_seat.id = sr.to_seat_id
      WHERE requester.user_id = $1
        ${journeyClause}
      ORDER BY sr.created_at DESC
    `,
    values
  );

  return result.rows;
}

async function updateStatus(swapId, status, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      UPDATE swap_requests
      SET status = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [swapId, status]
  );

  return result.rows[0] || null;
}

async function markRequesterConfirmed(swapId, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      UPDATE swap_requests
      SET requester_final_confirmed = TRUE,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [swapId]
  );

  return result.rows[0] || null;
}

async function markReceiverConfirmed(swapId, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      UPDATE swap_requests
      SET receiver_final_confirmed = TRUE,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [swapId]
  );

  return result.rows[0] || null;
}

async function completeSwap(request, executor) {
  const db = getExecutor(executor);

  await db.query(
    `
      UPDATE passenger_journeys
      SET assigned_seat_id = CASE
        WHEN id = $1 THEN $4
        WHEN id = $2 THEN $3
      END,
      updated_at = NOW()
      WHERE id IN ($1, $2)
    `,
    [
      request.from_passenger_journey_id,
      request.to_passenger_journey_id,
      request.from_seat_id,
      request.to_seat_id
    ]
  );

  await db.query(
    `
      UPDATE seats
      SET current_passenger_journey_id = CASE
        WHEN id = $1 THEN $4
        WHEN id = $2 THEN $3
      END,
      updated_at = NOW()
      WHERE id IN ($1, $2)
    `,
    [
      request.from_seat_id,
      request.to_seat_id,
      request.from_passenger_journey_id,
      request.to_passenger_journey_id
    ]
  );

  await db.query(
    `
      UPDATE swap_requests
      SET status = 'completed',
          updated_at = NOW()
      WHERE id = $1
    `,
    [request.id]
  );
}

async function expireActiveRequests(cutoff, statuses, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      WITH expired AS (
        UPDATE swap_requests sr
        SET status = 'expired',
            updated_at = NOW()
        FROM passenger_journeys requester, passenger_journeys receiver
        WHERE sr.status = ANY($2)
          AND sr.expires_at < $1
          AND requester.id = sr.from_passenger_journey_id
          AND receiver.id = sr.to_passenger_journey_id
        RETURNING
          sr.id,
          sr.journey_id,
          requester.user_id AS requester_user_id,
          receiver.user_id AS receiver_user_id
      )
      SELECT * FROM expired
    `,
    [cutoff, statuses]
  );

  return result.rows;
}

async function listSwaps(filters = {}, executor) {
  const db = getExecutor(executor);
  const clauses = [];
  const values = [];

  if (filters.status) {
    values.push(filters.status);
    clauses.push(`sr.status = $${values.length}`);
  }

  if (filters.journeyId) {
    values.push(filters.journeyId);
    clauses.push(`sr.journey_id = $${values.length}`);
  }

  if (filters.coachOrBusNumber) {
    values.push(`%${filters.coachOrBusNumber}%`);
    clauses.push(`j.coach_or_bus_number ILIKE $${values.length}`);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await db.query(
    `
      SELECT
        sr.id,
        sr.status,
        sr.message,
        sr.requester_final_confirmed,
        sr.receiver_final_confirmed,
        sr.expires_at,
        sr.created_at,
        j.id AS journey_id,
        j.journey_type,
        j.journey_code,
        j.journey_date,
        j.coach_or_bus_number,
        requester.passenger_name AS requester_name,
        receiver.passenger_name AS receiver_name,
        from_seat.seat_number AS from_seat_number,
        to_seat.seat_number AS to_seat_number
      FROM swap_requests sr
      INNER JOIN journeys j ON j.id = sr.journey_id
      INNER JOIN passenger_journeys requester ON requester.id = sr.from_passenger_journey_id
      INNER JOIN passenger_journeys receiver ON receiver.id = sr.to_passenger_journey_id
      INNER JOIN seats from_seat ON from_seat.id = sr.from_seat_id
      INNER JOIN seats to_seat ON to_seat.id = sr.to_seat_id
      ${whereClause}
      ORDER BY sr.created_at DESC
    `,
    values
  );

  return result.rows;
}

async function getAnalytics(executor) {
  const db = getExecutor(executor);
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM journeys) AS total_journeys,
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM seats) AS total_seats,
      (SELECT COUNT(*) FROM swap_requests) AS total_swap_requests,
      (SELECT COUNT(*) FROM swap_requests WHERE status = 'completed') AS completed_swaps,
      (SELECT COUNT(*) FROM swap_requests WHERE status IN ('pending', 'accepted')) AS pending_requests
  `);

  return result.rows[0];
}

module.exports = {
  completeSwap,
  createSwapRequest,
  expireActiveRequests,
  findSeatById,
  findSeatConflicts,
  getActiveSeatRequests,
  getAnalytics,
  getSwapById,
  listIncomingByUser,
  listOutgoingByUser,
  listSwaps,
  markReceiverConfirmed,
  markRequesterConfirmed,
  updateStatus
};
