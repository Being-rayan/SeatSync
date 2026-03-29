const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

async function run() {
  const schemaPath = path.resolve(__dirname, "../sql/schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  await pool.query(schemaSql);
  console.log("SeatSync schema applied successfully.");
}

run()
  .catch((error) => {
    console.error("Failed to apply schema.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
