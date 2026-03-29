const { getExecutor } = require("./helpers");

async function findVerificationMatch(payload, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT
        pj.id AS passenger_journey_id,
        pj.user_id,
        pj.verified,
        pj.pnr_or_ticket_ref,
        pj.passenger_name,
        pj.boarding_point,
        pj.drop_point,
        j.id AS journey_id,
        j.journey_type,
        j.journey_code,
        j.journey_date,
        j.coach_or_bus_number,
        j.origin,
        j.destination,
        s.id AS seat_id,
        s.seat_number
      FROM passenger_journeys pj
      INNER JOIN journeys j ON j.id = pj.journey_id
      INNER JOIN seats s ON s.id = pj.assigned_seat_id
      WHERE LOWER(j.journey_type) = LOWER($1)
        AND LOWER(pj.pnr_or_ticket_ref) = LOWER($2)
        AND LOWER(pj.passenger_name) = LOWER($3)
        AND j.journey_date = $4
        AND LOWER(j.coach_or_bus_number) = LOWER($5)
        AND LOWER(s.seat_number) = LOWER($6)
        AND LOWER(pj.boarding_point) = LOWER($7)
        AND LOWER(pj.drop_point) = LOWER($8)
      LIMIT 1
    `,
    [
      payload.journeyType,
      payload.reference,
      payload.passengerName,
      payload.journeyDate,
      payload.coachOrBusNumber,
      payload.seatNumber,
      payload.boardingPoint,
      payload.destinationPoint
    ]
  );

  return result.rows[0] || null;
}

async function attachUserAndVerify(passengerJourneyId, userId, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      UPDATE passenger_journeys
      SET user_id = $2,
          verified = TRUE,
          verified_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [passengerJourneyId, userId]
  );

  return result.rows[0] || null;
}

async function getPassengerJourneyById(passengerJourneyId, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT
        pj.id AS passenger_journey_id,
        pj.user_id,
        pj.pnr_or_ticket_ref,
        pj.passenger_name,
        pj.boarding_point,
        pj.drop_point,
        pj.verified,
        pj.verified_at,
        pj.assigned_seat_id,
        pj.original_assigned_seat_id,
        assigned.seat_number AS assigned_seat_number,
        original_seat.seat_number AS original_seat_number,
        j.id AS journey_id,
        j.journey_type,
        j.journey_code,
        j.journey_date,
        j.coach_or_bus_number,
        j.origin,
        j.destination
      FROM passenger_journeys pj
      INNER JOIN journeys j ON j.id = pj.journey_id
      LEFT JOIN seats assigned ON assigned.id = pj.assigned_seat_id
      LEFT JOIN seats original_seat ON original_seat.id = pj.original_assigned_seat_id
      WHERE pj.id = $1
      LIMIT 1
    `,
    [passengerJourneyId]
  );

  return result.rows[0] || null;
}

async function getLatestVerifiedJourneyByUser(userId, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT
        pj.id AS passenger_journey_id,
        pj.user_id,
        pj.pnr_or_ticket_ref,
        pj.passenger_name,
        pj.boarding_point,
        pj.drop_point,
        pj.verified,
        pj.verified_at,
        pj.assigned_seat_id,
        pj.original_assigned_seat_id,
        assigned.seat_number AS assigned_seat_number,
        original_seat.seat_number AS original_seat_number,
        j.id AS journey_id,
        j.journey_type,
        j.journey_code,
        j.journey_date,
        j.coach_or_bus_number,
        j.origin,
        j.destination
      FROM passenger_journeys pj
      INNER JOIN journeys j ON j.id = pj.journey_id
      LEFT JOIN seats assigned ON assigned.id = pj.assigned_seat_id
      LEFT JOIN seats original_seat ON original_seat.id = pj.original_assigned_seat_id
      WHERE pj.user_id = $1
        AND pj.verified = TRUE
      ORDER BY pj.verified_at DESC NULLS LAST, pj.updated_at DESC
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function getPassengerJourneyByUserAndJourney(userId, journeyId, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT
        pj.id AS passenger_journey_id,
        pj.user_id,
        pj.pnr_or_ticket_ref,
        pj.passenger_name,
        pj.boarding_point,
        pj.drop_point,
        pj.verified,
        pj.verified_at,
        pj.assigned_seat_id,
        pj.original_assigned_seat_id,
        assigned.seat_number AS assigned_seat_number,
        original_seat.seat_number AS original_seat_number,
        j.id AS journey_id,
        j.journey_type,
        j.journey_code,
        j.journey_date,
        j.coach_or_bus_number,
        j.origin,
        j.destination
      FROM passenger_journeys pj
      INNER JOIN journeys j ON j.id = pj.journey_id
      LEFT JOIN seats assigned ON assigned.id = pj.assigned_seat_id
      LEFT JOIN seats original_seat ON original_seat.id = pj.original_assigned_seat_id
      WHERE pj.user_id = $1
        AND pj.journey_id = $2
        AND pj.verified = TRUE
      LIMIT 1
    `,
    [userId, journeyId]
  );

  return result.rows[0] || null;
}

async function getJourneyById(journeyId, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT id, journey_type, journey_code, journey_date, coach_or_bus_number, origin, destination
      FROM journeys
      WHERE id = $1
      LIMIT 1
    `,
    [journeyId]
  );

  return result.rows[0] || null;
}

async function getSeatMapRows(journeyId, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT
        s.id,
        s.journey_id,
        s.coach_or_bus_number,
        s.seat_number,
        s.seat_type,
        s.layout_x,
        s.layout_y,
        s.is_window,
        s.is_aisle,
        s.is_locked,
        pj.id AS passenger_journey_id,
        pj.user_id AS occupant_user_id,
        pj.passenger_name,
        pj.verified AS occupant_verified,
        pj.original_assigned_seat_id,
        u.name AS occupant_account_name
      FROM seats s
      LEFT JOIN passenger_journeys pj ON pj.id = s.current_passenger_journey_id
      LEFT JOIN users u ON u.id = pj.user_id
      WHERE s.journey_id = $1
      ORDER BY s.layout_y ASC, s.layout_x ASC, s.seat_number ASC
    `,
    [journeyId]
  );

  return result.rows;
}

async function listJourneys(filters = {}, executor) {
  const db = getExecutor(executor);
  const clauses = [];
  const values = [];

  if (filters.journeyType) {
    values.push(filters.journeyType);
    clauses.push(`j.journey_type = $${values.length}`);
  }

  if (filters.coachOrBusNumber) {
    values.push(`%${filters.coachOrBusNumber}%`);
    clauses.push(`j.coach_or_bus_number ILIKE $${values.length}`);
  }

  if (filters.journeyCode) {
    values.push(`%${filters.journeyCode}%`);
    clauses.push(`j.journey_code ILIKE $${values.length}`);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await db.query(
    `
      SELECT
        j.id,
        j.journey_type,
        j.journey_code,
        j.journey_date,
        j.coach_or_bus_number,
        j.origin,
        j.destination,
        COUNT(DISTINCT s.id) AS seat_count,
        COUNT(DISTINCT pj.id) AS passenger_count,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.verified = TRUE) AS verified_passenger_count,
        COUNT(DISTINCT sr.id) FILTER (WHERE sr.status IN ('pending', 'accepted')) AS active_swap_count,
        COUNT(DISTINCT sr.id) FILTER (WHERE sr.status = 'completed') AS completed_swap_count
      FROM journeys j
      LEFT JOIN seats s ON s.journey_id = j.id
      LEFT JOIN passenger_journeys pj ON pj.journey_id = j.id
      LEFT JOIN swap_requests sr ON sr.journey_id = j.id
      ${whereClause}
      GROUP BY j.id
      ORDER BY j.journey_date DESC, j.journey_code ASC
    `,
    values
  );

  return result.rows;
}

async function listSeats(filters = {}, executor) {
  const db = getExecutor(executor);
  const clauses = [];
  const values = [];

  if (filters.journeyId) {
    values.push(filters.journeyId);
    clauses.push(`s.journey_id = $${values.length}`);
  }

  if (filters.coachOrBusNumber) {
    values.push(`%${filters.coachOrBusNumber}%`);
    clauses.push(`s.coach_or_bus_number ILIKE $${values.length}`);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await db.query(
    `
      SELECT
        s.id,
        s.journey_id,
        s.coach_or_bus_number,
        s.seat_number,
        s.seat_type,
        s.is_window,
        s.is_aisle,
        s.is_locked,
        j.journey_type,
        j.journey_code,
        j.journey_date,
        pj.passenger_name,
        pj.verified,
        u.email AS occupant_email
      FROM seats s
      INNER JOIN journeys j ON j.id = s.journey_id
      LEFT JOIN passenger_journeys pj ON pj.id = s.current_passenger_journey_id
      LEFT JOIN users u ON u.id = pj.user_id
      ${whereClause}
      ORDER BY j.journey_date DESC, s.coach_or_bus_number ASC, s.seat_number ASC
    `,
    values
  );

  return result.rows;
}

async function setSeatLock(seatId, isLocked, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      UPDATE seats
      SET is_locked = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, journey_id, coach_or_bus_number, seat_number, seat_type, is_locked
    `,
    [seatId, isLocked]
  );

  return result.rows[0] || null;
}

module.exports = {
  attachUserAndVerify,
  findVerificationMatch,
  getJourneyById,
  getLatestVerifiedJourneyByUser,
  getPassengerJourneyById,
  getPassengerJourneyByUserAndJourney,
  getSeatMapRows,
  listJourneys,
  listSeats,
  setSeatLock
};
