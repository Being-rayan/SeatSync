const env = require("../config/env");
const { withTransaction } = require("../config/db");
const memoryRepositories = require("../devMemory/repositories");
const auditRepository = require("../db/repositories/auditRepository");
const journeyRepository = require("../db/repositories/journeyRepository");
const notificationRepository = require("../db/repositories/notificationRepository");
const swapRepository = require("../db/repositories/swapRepository");
const userRepository = require("../db/repositories/userRepository");

let runtimeMode = env.devMemoryMode === "true" ? "memory" : "database";
let didLogFallback = false;

function flattenErrors(error, collected = []) {
  if (!error) {
    return collected;
  }

  collected.push(error);

  if (Array.isArray(error.errors)) {
    for (const nestedError of error.errors) {
      flattenErrors(nestedError, collected);
    }
  }

  if (error.cause) {
    flattenErrors(error.cause, collected);
  }

  return collected;
}

function isDatabaseConnectivityError(error) {
  return flattenErrors(error).some((entry) => {
    const code = String(entry.code || "");
    const message = String(entry.message || entry);

    return (
      [
        "ECONNREFUSED",
        "ECONNRESET",
        "ENOTFOUND",
        "EAI_AGAIN",
        "ETIMEDOUT",
        "57P03",
        "3D000"
      ].includes(code) ||
      /aggregateerror|connect|connection|database .* does not exist|getaddrinfo/i.test(message)
    );
  });
}

function allowMemoryFallback() {
  return env.nodeEnv !== "production" && env.devMemoryMode !== "false";
}

function activateMemoryFallback(error) {
  runtimeMode = "memory";

  if (!didLogFallback) {
    didLogFallback = true;
    console.warn("SeatSync database unavailable. Falling back to in-memory demo data.");

    if (error?.message) {
      console.warn(`Database error: ${error.message}`);
    }
  }
}

async function runWithFallback(databaseOperation, memoryOperation) {
  if (runtimeMode === "memory") {
    return memoryOperation();
  }

  try {
    return await databaseOperation();
  } catch (error) {
    if (!allowMemoryFallback() || !isDatabaseConnectivityError(error)) {
      throw error;
    }

    activateMemoryFallback(error);
    return memoryOperation();
  }
}

function wrapRepository(databaseRepository, memoryRepository) {
  return Object.fromEntries(
    Object.keys(memoryRepository).map((methodName) => [
      methodName,
      (...args) =>
        runWithFallback(
          () => databaseRepository[methodName](...args),
          () => memoryRepository[methodName](...args)
        )
    ])
  );
}

async function transactionRunner(handler) {
  if (runtimeMode === "memory") {
    return memoryRepositories.transactionRunner(handler);
  }

  try {
    return await withTransaction(handler);
  } catch (error) {
    if (!allowMemoryFallback() || !isDatabaseConnectivityError(error)) {
      throw error;
    }

    activateMemoryFallback(error);
    return memoryRepositories.transactionRunner(handler);
  }
}

module.exports = {
  auditRepository: wrapRepository(auditRepository, memoryRepositories.auditRepository),
  journeyRepository: wrapRepository(journeyRepository, memoryRepositories.journeyRepository),
  notificationRepository: wrapRepository(
    notificationRepository,
    memoryRepositories.notificationRepository
  ),
  swapRepository: wrapRepository(swapRepository, memoryRepositories.swapRepository),
  transactionRunner,
  userRepository: wrapRepository(userRepository, memoryRepositories.userRepository)
};
