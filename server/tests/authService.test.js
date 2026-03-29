const assert = require("node:assert/strict");
const test = require("node:test");
const { createAuthService } = require("../services/authService");

function createAuthHarness() {
  const users = [];
  let idCounter = 1;

  return {
    service: createAuthService({
      userRepository: {
        async findByEmail(email) {
          return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
        },
        async findById(id) {
          return users.find((user) => user.id === id) || null;
        },
        async createUser(payload) {
          const row = {
            id: idCounter += 1,
            name: payload.name,
            email: payload.email,
            password_hash: payload.passwordHash,
            role: payload.role,
            created_at: new Date().toISOString()
          };

          users.push(row);

          return {
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            created_at: row.created_at
          };
        }
      },
      journeyRepository: {
        async getLatestVerifiedJourneyByUser() {
          return null;
        }
      },
      auditRepository: {
        async logAction() {}
      }
    }),
    users
  };
}

test("registers a passenger and allows login", async () => {
  const { service } = createAuthHarness();
  const registerResult = await service.register({
    name: "Demo Passenger",
    email: "demo@seatsync.dev",
    password: "Travel@123"
  });

  assert.ok(registerResult.token);
  assert.equal(registerResult.user.email, "demo@seatsync.dev");
  assert.equal(registerResult.user.role, "passenger");

  const loginResult = await service.login({
    email: "demo@seatsync.dev",
    password: "Travel@123"
  });

  assert.ok(loginResult.token);
  assert.equal(loginResult.user.email, "demo@seatsync.dev");
});

test("rejects login with an invalid password", async () => {
  const { service } = createAuthHarness();

  await service.register({
    name: "Demo Passenger",
    email: "demo@seatsync.dev",
    password: "Travel@123"
  });

  await assert.rejects(
    () =>
      service.login({
        email: "demo@seatsync.dev",
        password: "WrongPass123"
      }),
    (error) => error.statusCode === 401
  );
});
