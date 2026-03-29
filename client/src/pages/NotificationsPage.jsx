import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import usePolling from "../hooks/usePolling";
import { getNotifications, markNotificationRead } from "../services/notificationService";
import { getApiErrorMessage } from "../utils/apiError";
import { formatDateTime } from "../utils/formatters";

function notificationTheme(type) {
  switch (type) {
    case "new_swap_request":
      return {
        badge: "bg-primary/15 text-primary",
        icon: "swap_horiz",
        iconWrap: "bg-primary/15 text-primary"
      };
    case "request_accepted":
    case "final_confirmation_pending":
      return {
        badge: "bg-yellow-500/15 text-yellow-400",
        icon: "handshake",
        iconWrap: "bg-yellow-500/15 text-yellow-400"
      };
    case "swap_completed":
      return {
        badge: "bg-emerald-500/15 text-emerald-400",
        icon: "check_circle",
        iconWrap: "bg-emerald-500/15 text-emerald-400"
      };
    case "request_rejected":
    case "request_expired":
    case "request_cancelled":
      return {
        badge: "bg-rose-500/15 text-rose-400",
        icon: "cancel",
        iconWrap: "bg-rose-500/15 text-rose-400"
      };
    default:
      return {
        badge: "bg-slate-700/70 text-slate-200",
        icon: "notifications",
        iconWrap: "bg-slate-700/70 text-slate-200"
      };
  }
}

function NotificationsPage() {
  const navigate = useNavigate();
  const { currentJourney, logout, user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } finally {
      setIsLoading(false);
    }
  };

  usePolling(loadNotifications, 7000, true, true);

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const readCount = notifications.length - unreadCount;
  const priorityCount = useMemo(
    () =>
      notifications.filter((item) =>
        ["new_swap_request", "final_confirmation_pending", "swap_completed"].includes(item.type)
      ).length,
    [notifications]
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRead = async (id) => {
    try {
      await markNotificationRead(id);
      await loadNotifications();
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Could not update notification",
        message: getApiErrorMessage(error, "Please try again.")
      });
    }
  };

  if (isLoading) {
    return <LoadingScreen label="Loading notifications" />;
  }

  const navigation =
    user.role === "admin"
      ? [
          { label: "Overview", to: "/admin" },
          { label: "Journeys", to: "/admin/journeys" },
          { label: "Swap Monitor", to: "/admin/swaps" },
          { active: true, label: "Alerts", to: "/app/notifications" }
        ]
      : [
          { label: "My Seats", to: "/app/dashboard" },
          { label: "Marketplace", to: "/app/swaps" },
          { active: true, label: "Alerts", to: "/app/notifications" }
        ];

  return (
    <div className="min-h-screen bg-background-dark font-display text-slate-100">
      <div
        className="min-h-screen"
        style={{
          backgroundImage:
            "radial-gradient(at 0% 0%, rgba(60, 131, 246, 0.12) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.08) 0px, transparent 50%)"
        }}
      >
        <header className="sticky top-0 z-50 border-b border-white/5 bg-background-dark/80 px-6 py-4 backdrop-blur-md lg:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary p-2 text-white">
                <span className="material-symbols-outlined text-2xl leading-none">
                  airline_seat_recline_extra
                </span>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white">SeatSync Alerts</h1>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Refreshing every 7 seconds
                </p>
              </div>
            </div>

            <nav className="hidden items-center gap-8 md:flex">
              {navigation.map((item) => (
                <Link
                  key={item.to}
                  className={
                    item.active
                      ? "border-b-2 border-primary pb-1 text-sm font-bold text-white"
                      : "text-sm font-medium text-slate-400 transition-colors hover:text-white"
                  }
                  to={item.to}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-right sm:block">
                <p className="text-sm font-bold text-white">{user.name}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary">{user.role}</p>
              </div>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                onClick={handleLogout}
                type="button"
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[320px_1fr] lg:px-10">
          <aside className="space-y-6">
            <div
              className="rounded-[1.75rem] p-6"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
            >
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
                Inbox Summary
              </span>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Unread</p>
                  <p className="mt-2 text-3xl font-black text-white">{unreadCount}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Priority Flow</p>
                  <p className="mt-2 text-3xl font-black text-yellow-400">{priorityCount}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Read Archive</p>
                  <p className="mt-2 text-3xl font-black text-slate-300">{readCount}</p>
                </div>
              </div>
            </div>

            <div
              className="rounded-[1.75rem] p-6"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
            >
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
                {user.role === "admin" ? "Control Room" : "Journey Context"}
              </span>

              {user.role === "admin" ? (
                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  <p>All request alerts, completion events, and monitoring exceptions surface here.</p>
                  <p className="text-slate-500">
                    Use journeys and swap monitor when an alert requires seat-level action.
                  </p>
                </div>
              ) : currentJourney ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Journey</p>
                    <p className="mt-2 text-lg font-bold text-white">{currentJourney.journey.code}</p>
                    <p className="text-sm text-slate-400">
                      {currentJourney.journey.origin} to {currentJourney.journey.destination}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Seat</p>
                    <p className="mt-2 text-lg font-bold text-primary">
                      {currentJourney.assignedSeat?.number || "--"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {currentJourney.journey.coachOrBusNumber}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  <p className="text-sm text-slate-300">
                    Verify a journey to unlock seat-map alerts and request notifications.
                  </p>
                  <Link
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
                    to="/verify"
                  >
                    <span className="material-symbols-outlined text-base">verified_user</span>
                    Verify Journey
                  </Link>
                </div>
              )}
            </div>
          </aside>

          <section
            className="rounded-[2rem] p-6 lg:p-8"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
                  Live Inbox
                </span>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                  {notifications.length} notification{notifications.length === 1 ? "" : "s"}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Request decisions and mutual-consent milestones appear here automatically.
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sync Mode</p>
                <p className="mt-1 text-sm font-bold text-emerald-400">Polling active</p>
              </div>
            </div>

            {notifications.length ? (
              <div className="space-y-4">
                {notifications.map((item) => {
                  const theme = notificationTheme(item.type);

                  return (
                    <article
                      key={item.id}
                      className={`rounded-[1.5rem] border p-5 transition-all ${
                        item.isRead
                          ? "border-white/5 bg-black/10 opacity-70"
                          : "border-primary/20 bg-white/5 shadow-lg shadow-primary/5"
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <div
                            className={`flex h-12 w-12 flex-none items-center justify-center rounded-2xl ${theme.iconWrap}`}
                          >
                            <span className="material-symbols-outlined">{theme.icon}</span>
                          </div>

                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] ${theme.badge}`}
                              >
                                {item.type.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs text-slate-500">
                                {formatDateTime(item.createdAt)}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-white">{item.title}</h3>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                              {item.body}
                            </p>
                          </div>
                        </div>

                        {!item.isRead ? (
                          <button
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
                            onClick={() => handleRead(item.id)}
                            type="button"
                          >
                            Mark read
                          </button>
                        ) : (
                          <span className="inline-flex h-11 items-center justify-center rounded-xl border border-white/5 bg-black/10 px-4 text-sm font-medium text-slate-500">
                            Read
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-black/10 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-primary">
                  <span className="material-symbols-outlined text-3xl">notifications_off</span>
                </div>
                <h3 className="mt-6 text-2xl font-black text-white">No notifications yet</h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
                  Request updates, seat-map changes, and final consent prompts will appear here once
                  verified swap activity starts.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default NotificationsPage;
