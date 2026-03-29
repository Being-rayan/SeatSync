const { pool } = require("../../config/db");

function getExecutor(executor) {
  return executor || pool;
}

function toJson(value) {
  return JSON.stringify(value || {});
}

module.exports = {
  getExecutor,
  toJson
};
