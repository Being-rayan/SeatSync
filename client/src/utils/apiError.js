export function getApiErrorMessage(error, fallbackMessage) {
  const apiMessage = error?.response?.data?.error?.message;

  if (apiMessage) {
    return apiMessage;
  }

  if (error?.code === "ERR_NETWORK") {
    return "SeatSync could not reach the API. Confirm the backend is running and the API URL is correct.";
  }

  if ((error?.response?.status ?? 0) >= 500) {
    return "SeatSync hit a server error. Check the backend database connection and environment settings.";
  }

  return fallbackMessage;
}
