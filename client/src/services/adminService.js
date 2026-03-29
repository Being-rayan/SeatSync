import api from "./api";

export async function getAdminAnalytics() {
  const response = await api.get("/admin/analytics");
  return response.data.data;
}

export async function getAdminJourneys(params = {}) {
  const response = await api.get("/admin/journeys", { params });
  return response.data.data;
}

export async function getAdminUsers() {
  const response = await api.get("/admin/users");
  return response.data.data;
}

export async function getAdminSwaps(params = {}) {
  const response = await api.get("/admin/swaps", { params });
  return response.data.data;
}

export async function getAdminSeats(params = {}) {
  const response = await api.get("/admin/seats", { params });
  return response.data.data;
}

export async function lockSeat(id) {
  const response = await api.patch(`/admin/seats/${id}/lock`);
  return response.data.data;
}

export async function unlockSeat(id) {
  const response = await api.patch(`/admin/seats/${id}/unlock`);
  return response.data.data;
}
