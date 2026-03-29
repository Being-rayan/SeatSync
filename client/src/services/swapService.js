import api from "./api";

export async function createSwapRequest(payload) {
  const response = await api.post("/swaps", payload);
  return response.data.data;
}

export async function getIncomingSwaps(journeyId) {
  const response = await api.get("/swaps/incoming", {
    params: journeyId ? { journeyId } : {}
  });
  return response.data.data;
}

export async function getOutgoingSwaps(journeyId) {
  const response = await api.get("/swaps/outgoing", {
    params: journeyId ? { journeyId } : {}
  });
  return response.data.data;
}

export async function acceptSwap(id) {
  const response = await api.patch(`/swaps/${id}/accept`);
  return response.data.data;
}

export async function rejectSwap(id) {
  const response = await api.patch(`/swaps/${id}/reject`);
  return response.data.data;
}

export async function cancelSwap(id) {
  const response = await api.patch(`/swaps/${id}/cancel`);
  return response.data.data;
}

export async function finalConfirmSwap(id) {
  const response = await api.patch(`/swaps/${id}/final-confirm`);
  return response.data.data;
}
