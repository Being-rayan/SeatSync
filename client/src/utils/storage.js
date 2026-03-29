const STORAGE_KEY = "seatsync_auth_token";

export function getStoredToken() {
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setStoredToken(token) {
  window.localStorage.setItem(STORAGE_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(STORAGE_KEY);
}
