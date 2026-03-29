DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS swap_requests CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS passenger_journeys CASCADE;
DROP TABLE IF EXISTS journeys CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'passenger' CHECK (role IN ('passenger', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX users_email_unique_ci ON users (LOWER(email));

CREATE TABLE journeys (
  id BIGSERIAL PRIMARY KEY,
  journey_type VARCHAR(20) NOT NULL CHECK (journey_type IN ('train', 'bus')),
  journey_code VARCHAR(60) NOT NULL,
  journey_date DATE NOT NULL,
  coach_or_bus_number VARCHAR(30) NOT NULL,
  origin VARCHAR(120) NOT NULL,
  destination VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX journeys_unique_instance_idx
  ON journeys (journey_type, journey_code, journey_date, coach_or_bus_number);

CREATE TABLE passenger_journeys (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  journey_id BIGINT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  pnr_or_ticket_ref VARCHAR(80) NOT NULL,
  passenger_name VARCHAR(120) NOT NULL,
  assigned_seat_id BIGINT,
  original_assigned_seat_id BIGINT,
  boarding_point VARCHAR(120) NOT NULL,
  drop_point VARCHAR(120) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX passenger_journeys_user_idx ON passenger_journeys (user_id);
CREATE INDEX passenger_journeys_journey_idx ON passenger_journeys (journey_id);

CREATE TABLE seats (
  id BIGSERIAL PRIMARY KEY,
  journey_id BIGINT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  coach_or_bus_number VARCHAR(30) NOT NULL,
  seat_number VARCHAR(20) NOT NULL,
  seat_type VARCHAR(30) NOT NULL,
  layout_x INTEGER NOT NULL,
  layout_y INTEGER NOT NULL,
  is_window BOOLEAN NOT NULL DEFAULT FALSE,
  is_aisle BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  current_passenger_journey_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (journey_id, seat_number)
);

CREATE INDEX seats_journey_idx ON seats (journey_id, coach_or_bus_number);
CREATE INDEX seats_current_passenger_idx ON seats (current_passenger_journey_id);

ALTER TABLE passenger_journeys
  ADD CONSTRAINT passenger_journeys_assigned_seat_fk
  FOREIGN KEY (assigned_seat_id) REFERENCES seats(id) ON DELETE SET NULL;

ALTER TABLE passenger_journeys
  ADD CONSTRAINT passenger_journeys_original_seat_fk
  FOREIGN KEY (original_assigned_seat_id) REFERENCES seats(id) ON DELETE SET NULL;

ALTER TABLE seats
  ADD CONSTRAINT seats_current_passenger_fk
  FOREIGN KEY (current_passenger_journey_id) REFERENCES passenger_journeys(id) ON DELETE SET NULL;

CREATE TABLE swap_requests (
  id BIGSERIAL PRIMARY KEY,
  journey_id BIGINT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  from_passenger_journey_id BIGINT NOT NULL REFERENCES passenger_journeys(id) ON DELETE CASCADE,
  to_passenger_journey_id BIGINT NOT NULL REFERENCES passenger_journeys(id) ON DELETE CASCADE,
  from_seat_id BIGINT NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  to_seat_id BIGINT NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  message VARCHAR(280),
  status VARCHAR(20) NOT NULL CHECK (
    status IN ('pending', 'accepted', 'rejected', 'expired', 'completed', 'cancelled')
  ),
  requester_final_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  receiver_final_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX swap_requests_journey_status_idx ON swap_requests (journey_id, status);
CREATE INDEX swap_requests_incoming_idx ON swap_requests (to_passenger_journey_id, status);
CREATE INDEX swap_requests_outgoing_idx ON swap_requests (from_passenger_journey_id, status);
CREATE INDEX swap_requests_expiry_idx ON swap_requests (expires_at);

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(60) NOT NULL,
  title VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  meta_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_idx ON notifications (user_id, is_read, created_at DESC);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id BIGINT NOT NULL,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);
