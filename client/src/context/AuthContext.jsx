import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as loginRequest, me, register as registerRequest } from "../services/authService";
import { clearStoredToken, getStoredToken, setStoredToken } from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(null);
  const [currentJourney, setCurrentJourney] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const clearSession = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setCurrentJourney(null);
  };

  const applyAuthState = (auth) => {
    setStoredToken(auth.token);
    setToken(auth.token);
    setUser(auth.user);
  };

  const loadProfile = async () => {
    const data = await me();
    setUser(data.user);
    setCurrentJourney(data.currentJourney);
    return data;
  };

  const refreshProfile = async () => {
    if (!getStoredToken()) {
      setIsBootstrapping(false);
      return null;
    }

    try {
      return await loadProfile();
    } catch (error) {
      clearSession();
      throw error;
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    refreshProfile().catch(() => null);
  }, []);

  const login = async (payload) => {
    const auth = await loginRequest(payload);
    applyAuthState(auth);
    setCurrentJourney(null);

    if (auth.user.role === "admin") {
      return { currentJourney: null, user: auth.user };
    }

    try {
      return await loadProfile();
    } catch (error) {
      if (error.response?.status === 401) {
        clearSession();
        throw error;
      }

      return { currentJourney: null, user: auth.user };
    }
  };

  const register = async (payload) => {
    const auth = await registerRequest(payload);
    applyAuthState(auth);
    setCurrentJourney(null);
    return { currentJourney: null, user: auth.user };
  };

  const logout = () => {
    clearSession();
  };

  const value = useMemo(
    () => ({
      currentJourney,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      login,
      logout,
      refreshProfile,
      register,
      setCurrentJourney,
      token,
      user
    }),
    [currentJourney, isBootstrapping, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
