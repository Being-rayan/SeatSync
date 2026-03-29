import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import usePolling from "../hooks/usePolling";
import { getNotifications } from "../services/notificationService";
import { getIncomingSwaps, getOutgoingSwaps } from "../services/swapService";
import { getApiErrorMessage } from "../utils/apiError";
import { formatDate } from "../utils/formatters";

function shortCode(place) {
  if (!place) {
    return "---";
  }

  return place
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function PassengerDashboardPage() {
  const navigate = useNavigate();
  const { currentJourney, logout, user } = useAuth();
  const { showToast } = useToast();
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  if (user?.role === "admin") {
    return <Navigate replace to="/admin" />;
  }

  if (!currentJourney) {
    return <Navigate replace to="/verify" />;
  }

  const loadDashboard = async () => {
    try {
      const [incomingData, outgoingData, notificationData] = await Promise.all([
        getIncomingSwaps(currentJourney.journey.id),
        getOutgoingSwaps(currentJourney.journey.id),
        getNotifications()
      ]);

      setIncoming(incomingData);
      setOutgoing(outgoingData);
      setNotifications(notificationData);
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Dashboard refresh failed",
        message: getApiErrorMessage(error, "Could not refresh journey data.")
      });
    } finally {
      setIsLoading(false);
    }
  };

  usePolling(loadDashboard, 7000, true, true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const recentSwaps = useMemo(() => {
    return [...incoming, ...outgoing]
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 3);
  }, [incoming, outgoing]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200 bg-background-light/80 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/80 lg:px-20">
            <div className="flex items-center gap-4">
              <div className="text-primary">
                <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor" />
                  <path
                    clipRule="evenodd"
                    d="M39.998 12.236C39.9944 12.2537 39.9875 12.2845 39.9748 12.3294C39.9436 12.4399 39.8949 12.5741 39.8346 12.7175C39.8168 12.7597 39.7989 12.8007 39.7813 12.8398C38.5103 13.7113 35.9788 14.9393 33.7095 15.4811C30.9875 16.131 27.6413 16.5217 24 16.5217C20.3587 16.5217 17.0125 16.131 14.2905 15.4811C12.0012 14.9346 9.44505 13.6897 8.18538 12.8168C8.17384 12.7925 8.16216 12.767 8.15052 12.7408C8.09919 12.6249 8.05721 12.5114 8.02977 12.411C8.00356 12.3152 8.00039 12.2667 8.00004 12.2612C8.00004 12.261 8 12.2607 8.00004 12.2612C8.00004 12.2359 8.0104 11.9233 8.68485 11.3686C9.34546 10.8254 10.4222 10.2469 11.9291 9.72276C14.9242 8.68098 19.1919 8 24 8C28.8081 8 33.0758 8.68098 36.0709 9.72276C37.5778 10.2469 38.6545 10.8254 39.3151 11.3686C39.9006 11.8501 39.9857 12.1489 39.998 12.236ZM4.95178 15.2312L21.4543 41.6973C22.6288 43.5809 25.3712 43.5809 26.5457 41.6973L43.0534 15.223C43.0709 15.1948 43.0878 15.1662 43.104 15.1371L41.3563 14.1648C43.104 15.1371 43.1038 15.1374 43.104 15.1371L43.1051 15.135L43.1065 15.1325L43.1101 15.1261L43.1199 15.1082C43.1276 15.094 43.1377 15.0754 43.1497 15.0527C43.1738 15.0075 43.2062 14.9455 43.244 14.8701C43.319 14.7208 43.4196 14.511 43.5217 14.2683C43.6901 13.8679 44 13.0689 44 12.2609C44 10.5573 43.003 9.22254 41.8558 8.2791C40.6947 7.32427 39.1354 6.55361 37.385 5.94477C33.8654 4.72057 29.133 4 24 4C18.867 4 14.1346 4.72057 10.615 5.94478C8.86463 6.55361 7.30529 7.32428 6.14419 8.27911C4.99695 9.22255 3.99999 10.5573 3.99999 12.2609C3.99999 13.1275 4.29264 13.9078 4.49321 14.3607C4.60375 14.6102 4.71348 14.8196 4.79687 14.9689C4.83898 15.0444 4.87547 15.1065 4.9035 15.1529C4.91754 15.1762 4.92954 15.1957 4.93916 15.2111L4.94662 15.223L4.95178 15.2312ZM35.9868 18.996L24 38.22L12.0131 18.996C12.4661 19.1391 12.9179 19.2658 13.3617 19.3718C16.4281 20.1039 20.0901 20.5217 24 20.5217C27.9099 20.5217 31.5719 20.1039 34.6383 19.3718C35.082 19.2658 35.5339 19.1391 35.9868 18.996Z"
                    fill="currentColor"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold leading-tight tracking-tight">SeatSync</h2>
            </div>

            <div className="flex items-center gap-4 lg:gap-8">
              <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
                <Link className="border-b-2 border-primary py-1 text-primary" to="/app/dashboard">
                  Dashboard
                </Link>
                <Link className="text-slate-500 transition-colors hover:text-slate-100" to="/app/swaps">
                  Marketplace
                </Link>
                <Link className="text-slate-500 transition-colors hover:text-slate-100" to="/app/notifications">
                  Alerts
                </Link>
              </nav>

              <div className="flex gap-2">
                <Link className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-900 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700" to="/app/notifications">
                  <span className="material-symbols-outlined">notifications</span>
                </Link>
                <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-900 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700" onClick={handleLogout} type="button">
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>

              <div className="flex items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-800">
                <div
                  className="size-9 rounded-full border-2 border-primary bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBqtDJU4vOb8HQOYlJd9Pw1Ipkz6rROvCSakAgRvE-OON23JcM_p7TyFNQSKkK-RaE5IzbU2c2Dp3HORDdG9P-RJ9TurwdIbITX1zFvOp9Uat38QrFepY71zvKMQB_LOq109Nv4qzu5pBQiONcCS62bb0cObTM7mI-n_UfQRDX872l-kcRrjb81lwoKbJGc2NmdYQWGzIrPONagctVNst7zi4tHk9msCPt9hzmCRfla1dnC4LKc0QMgENFyeEWwhKZr9n4H0sxRQko")'
                  }}
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-bold leading-none">{user.name}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-primary">
                    Verified Passenger
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-10 lg:px-20">
            <section className="mb-12">
              <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h1 className="mb-2 text-3xl font-black tracking-tight md:text-4xl">
                    Welcome back, {user.name.split(" ")[0]}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400">
                    Ready to find your perfect seat for today&apos;s journey?
                  </p>
                </div>
                <Link
                  className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-blue-600 active:scale-[0.98]"
                  to="/app/swaps"
                >
                  <span className="material-symbols-outlined">map</span>
                  Enter Live Seat Map
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                  <div>
                    <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                      My Active Journey
                    </h3>
                    <div
                      className="group relative overflow-hidden rounded-2xl p-6"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255, 255, 255, 0.08)"
                      }}
                    >
                      <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[80px]" />
                      <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row">
                        <div
                          className="aspect-square w-full rounded-xl border border-white/10 bg-cover bg-center md:w-48"
                          style={{
                            backgroundImage:
                              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBXrs2Iebx6qf4hqxYH7HNrRIkgLQVAbzxamij6QmKcU9pQMj3jU4NPZAltTXbtP_rGAlrs_--8kpnCCxF0gczroeUDU16Cts27AOMKpyIYq-pBx67X06NqkkkGwFQmqQyruBsdE4OUpXogYtH1N-Zq4QcKmp0QcP2URQ8uMIbCQn4ImOX_CjnLklNFUBmPlN6oq2Hck5saR9jVAh-D1IDXC5-_XeLLRpcVfq9Zgxu9cp0zJTUke-IccRD_IJyxIu4OeJIG-h6vgSQ")'
                          }}
                        />
                        <div className="w-full flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-3">
                            <span className="rounded bg-primary/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                              {currentJourney.journey.code}
                            </span>
                            <span className="text-sm text-slate-500">•</span>
                            <span className="text-sm font-medium text-slate-400">
                              {formatDate(currentJourney.journey.date)}
                            </span>
                          </div>

                          <div className="mb-6 flex items-center justify-between">
                            <div className="text-center md:text-left">
                              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                                From
                              </p>
                              <h2 className="text-2xl font-black">{shortCode(currentJourney.journey.origin)}</h2>
                              <p className="text-sm text-slate-400">{currentJourney.journey.origin}</p>
                            </div>
                            <div className="flex flex-1 flex-col items-center gap-1 px-4">
                              <div className="relative h-[2px] w-full bg-slate-700">
                                <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background-dark px-2 text-primary">
                                  train
                                </span>
                              </div>
                              <p className="text-[10px] font-bold text-slate-500">
                                {currentJourney.journey.type.toUpperCase()}
                              </p>
                            </div>
                            <div className="text-center md:text-right">
                              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                                To
                              </p>
                              <h2 className="text-2xl font-black">{shortCode(currentJourney.journey.destination)}</h2>
                              <p className="text-sm text-slate-400">{currentJourney.journey.destination}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/5 bg-white/5 p-4 md:grid-cols-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Current Seat
                              </p>
                              <p className="text-lg font-bold text-primary">
                                {currentJourney.assignedSeat?.number}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Coach / Bus
                              </p>
                              <p className="text-lg font-bold">{currentJourney.journey.coachOrBusNumber}</p>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Alerts
                              </p>
                              <p className="text-lg font-bold">{unreadCount}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                        Recent Swaps
                      </h3>
                      <Link className="text-xs font-bold text-primary hover:underline" to="/app/swaps">
                        View All
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {(isLoading ? [] : recentSwaps).length ? (
                        recentSwaps.map((swap) => {
                          const accent =
                            swap.status === "completed"
                              ? "bg-green-500/20 text-green-500"
                              : swap.status === "accepted"
                                ? "bg-primary/20 text-primary"
                                : "bg-slate-500/20 text-slate-400";

                          return (
                            <div
                              key={swap.id}
                              className="flex cursor-pointer items-center justify-between rounded-xl border border-white/8 p-4 transition-all hover:border-primary/30 hover:bg-white/6"
                              style={{
                                background: "rgba(255, 255, 255, 0.03)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(255, 255, 255, 0.08)"
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`flex size-10 items-center justify-center rounded-lg ${accent}`}>
                                  <span className="material-symbols-outlined">swap_horiz</span>
                                </div>
                                <div>
                                  <p className="text-sm font-bold">
                                    Seat {swap.requester.seat.number} → {swap.receiver.seat.number}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {swap.journey.origin} to {swap.journey.destination}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-xs font-bold ${swap.status === "completed" ? "text-green-500" : "text-slate-400"}`}>
                                  {swap.status.toUpperCase()}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {swap.message || "Verified exchange"}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div
                          className="rounded-xl p-5 text-sm text-slate-400"
                          style={{
                            background: "rgba(255, 255, 255, 0.03)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255, 255, 255, 0.08)"
                          }}
                        >
                          No recent swap activity yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                      Travel Insights
                    </h3>
                    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/20 to-indigo-500/10 p-6">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary text-white">
                          <span className="material-symbols-outlined">lightbulb</span>
                        </div>
                        <h4 className="font-bold">Pro Selection Tips</h4>
                      </div>

                      <div className="space-y-6">
                        {[
                          "Choose a swap close to your boarding or destination gate for low-friction movement.",
                          "Window and aisle preferences convert better when you add a short, polite message.",
                          "Accepted requests still need both final confirmations before the seat changes."
                        ].map((item, index) => (
                          <div key={item} className="flex gap-4">
                            <span className="text-xl font-black text-primary">0{index + 1}</span>
                            <div>
                              <p className="mb-1 text-sm font-bold">SeatSync Guidance</p>
                              <p className="text-xs leading-relaxed text-slate-400">{item}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Link className="mt-8 block w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-bold transition-colors hover:bg-white/10" to="/app/swaps">
                        Open Live Map
                      </Link>
                    </div>
                  </div>

                  <div
                    className="relative overflow-hidden rounded-2xl p-6"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.08)"
                    }}
                  >
                    <div className="relative z-10">
                      <h4 className="mb-2 font-bold">Live Demand</h4>
                      <p className="mb-4 text-xs text-slate-400">Current activity for your verified journey</p>

                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map((index) => (
                            <div
                              key={index}
                              className="size-6 rounded-full border-2 border-background-dark bg-slate-700"
                            />
                          ))}
                        </div>
                        <p className="text-[10px] font-medium text-slate-400">
                          <span className="font-bold text-primary">{incoming.length + outgoing.length} passengers</span>{" "}
                          looking for swaps
                        </p>
                      </div>

                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full w-[65%] bg-primary" />
                      </div>
                      <p className="mt-1.5 text-right text-[10px] font-medium text-slate-500">
                        High Match Probability
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <footer className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-slate-200 py-10 dark:border-slate-800 md:flex-row">
              <div className="flex items-center gap-2">
                <div className="text-slate-500">
                  <svg className="size-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">© 2023 SeatSync Technologies. All rights reserved.</p>
              </div>
              <div className="flex gap-8 text-sm font-medium text-slate-500">
                <Link className="transition-colors hover:text-primary" to="/app/notifications">
                  Privacy
                </Link>
                <Link className="transition-colors hover:text-primary" to="/app/swaps">
                  Terms
                </Link>
                <Link className="transition-colors hover:text-primary" to="/verify">
                  Help
                </Link>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

export default PassengerDashboardPage;
