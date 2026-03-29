import api from "./api";

export async function verifyJourney(payload) {
  const response = await api.post("/journey/verify", payload);
  return response.data.data;
}

export async function getCurrentJourney() {
  const response = await api.get("/journey/current");
  return response.data.data;
}

export async function getSeatMap(journeyId) {
  const response = await api.get(`/journeys/${journeyId}/seats`);
  return response.data.data;
}
