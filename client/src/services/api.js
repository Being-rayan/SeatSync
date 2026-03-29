import axios from "axios";
import { getStoredToken } from "../utils/storage";

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function isLikelyLocalDevHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^10(?:\.\d{1,3}){3}$/.test(hostname) ||
    /^192\.168(?:\.\d{1,3}){2}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/.test(hostname)
  );
}

export function resolveApiBaseUrl(
  runtimeEnv = import.meta.env,
  currentLocation = typeof window !== "undefined" ? window.location : undefined
) {
  const configuredBaseUrl = runtimeEnv?.VITE_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return trimTrailingSlash(configuredBaseUrl);
  }

  if (
    currentLocation &&
    isLikelyLocalDevHost(currentLocation.hostname) &&
    ["3000", "4173", "5173", "8080"].includes(currentLocation.port)
  ) {
    return `${currentLocation.protocol}//${currentLocation.hostname}:5000/api`;
  }

  return "/api";
}

const api = axios.create({
  baseURL: resolveApiBaseUrl()
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
