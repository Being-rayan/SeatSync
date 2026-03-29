const assert = require("node:assert/strict");
const test = require("node:test");
const authenticate = require("../middleware/auth");

test("rejects requests without a bearer token", async () => {
  const req = { headers: {} };

  await new Promise((resolve) => {
    authenticate(req, {}, (error) => {
      assert.equal(error.statusCode, 401);
      resolve();
    });
  });
});
