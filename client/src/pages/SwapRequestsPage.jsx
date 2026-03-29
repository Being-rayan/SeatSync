import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import SwapRequestModal from "../components/SwapRequestModal";
import usePolling from "../hooks/usePolling";
import { getSeatMap } from "../services/journeyService";
import { getNotifications } from "../services/notificationService";
import {
  acceptSwap,
  cancelSwap,
  createSwapRequest,
  finalConfirmSwap,
  getIncomingSwaps,
  getOutgoingSwaps,
  rejectSwap
} from "../services/swapService";
import { getApiErrorMessage } from "../utils/apiError";

function seatClasses(seat) {
  if (seat.primaryState === "mine") {
    return "bg-primary/20 border-primary text-primary scale-110 shadow-lg shadow-primary/30 z-10";
  }

  if (seat.primaryState === "available") {
    return "bg-green-500/20 border-green-500 text-green-500";
  }

  if (seat.primaryState === "pending") {
    return "bg-yellow-500/20 border-yellow-500 text-yellow-500";
  }

  if (seat.primaryState === "locked") {
    return "bg-red-500/20 border-red-500 text-red-500";
  }

  return "bg-slate-200 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-700";
}

function requestActionLabel(request, isIncoming) {
  if (request.canFinalConfirm) {
    return "Final Confirm";
  }

  if (isIncoming && request.canAccept) {
    return "Accept";
  }

  if (!isIncoming && request.canCancel) {
    return "Cancel";
  }

  return null;
}

function groupedSeats(seats) {
  const byRow = new Map();

  seats.forEach((seat) => {
    const key = seat.layoutY;
    if (!byRow.has(key)) {
      byRow.set(key, []);
    }
    byRow.get(key).push(seat);
  });

  return [...byRow.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([row, rowSeats]) => ({
      row,
      left: rowSeats.filter((seat) => seat.layoutX <= 2).sort((a, b) => a.layoutX - b.layoutX),
      right: rowSeats.filter((seat) => seat.layoutX > 2).sort((a, b) => a.layoutX - b.layoutX)
    }));
}

function SwapRequestsPage() {
  const navigate = useNavigate();
  const { currentJourney, logout, user } = useAuth();
  const { showToast } = useToast();
  const [seatMap, setSeatMap] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (user?.role === "admin") {
    return <Navigate replace to="/admin/swaps" />;
  }

  if (!currentJourney) {
    return <Navigate replace to="/verify" />;
  }

  const journeyId = currentJourney.journey.id;

  const loadSeatWorkspace = async () => {
    try {
      const [seatMapData, incomingData, outgoingData, notificationData] = await Promise.all([
        getSeatMap(journeyId),
        getIncomingSwaps(journeyId),
        getOutgoingSwaps(journeyId),
        getNotifications()
      ]);

      setSeatMap(seatMapData);
      setIncoming(incomingData);
      setOutgoing(outgoingData);
      setNotifications(notificationData);
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Seat map refresh failed",
        message: getApiErrorMessage(error, "Could not load the live seat map.")
      });
    } finally {
      setIsLoading(false);
    }
  };

  usePolling(loadSeatWorkspace, 5000, true, true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const runAction = async (handler, title, message) => {
    try {
      await handler();
      await loadSeatWorkspace();
      showToast({
        tone: "success",
        title,
        message
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Action failed",
        message: getApiErrorMessage(error, "Please try again.")
      });
    }
  };

  const handlePrimaryRequestAction = async (request, isIncoming) => {
    if (request.canFinalConfirm) {
      await runAction(
        () => finalConfirmSwap(request.id),
        "Confirmation saved",
        "SeatSync refreshed the mutual consent state."
      );
      return;
    }

    if (isIncoming && request.canAccept) {
      await runAction(
        () => acceptSwap(request.id),
        "Request accepted",
        "Both passengers can now confirm the swap."
      );
      return;
    }

    if (!isIncoming && request.canCancel) {
      await runAction(() => cancelSwap(request.id), "Request cancelled", "The outgoing request was closed.");
    }
  };

  const handleSecondaryRequestAction = async (request) => {
    if (request.canReject) {
      await runAction(() => rejectSwap(request.id), "Request rejected", "The requester has been notified.");
    }
  };

  const handleCreateRequest = async (message) => {
    if (!selectedSeat) {
      return;
    }

    setIsSending(true);

    try {
      await createSwapRequest({
        journeyId,
        toSeatId: selectedSeat.id,
        message
      });
      setSelectedSeat(null);
      await loadSeatWorkspace();
      showToast({
        tone: "success",
        title: "Swap request sent",
        message: "The passenger can now review your verified request."
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Could not send request",
        message: getApiErrorMessage(error, "Try another eligible seat.")
      });
    } finally {
      setIsSending(false);
    }
  };

  const rows = useMemo(() => groupedSeats(seatMap?.seats || []), [seatMap]);
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const ownSeatNumber = currentJourney.assignedSeat?.number || "--";
  const featuredRequest = incoming.find((request) => request.canFinalConfirm || request.canAccept) || outgoing.find((request) => request.canFinalConfirm || request.canCancel);

  return (
    <div className="relative min-h-screen bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200 bg-white px-6 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/50 md:px-10">
            <div className="flex items-center gap-4">
              <div className="size-8 text-primary">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor" />
                </svg>
              </div>
              <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">
                SeatSync Marketplace
              </h2>
            </div>

            <div className="flex flex-1 items-center justify-end gap-8">
              <nav className="hidden items-center gap-9 md:flex">
                <Link className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300" to="/app/dashboard">
                  My Seats
                </Link>
                <Link className="border-b-2 border-primary pb-1 text-sm font-bold text-slate-900 dark:text-white" to="/app/swaps">
                  Marketplace
                </Link>
                <Link className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300" to="/app/notifications">
                  Alerts
                </Link>
              </nav>
              <div className="flex gap-2">
                <Link className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-primary/10 dark:bg-slate-800 dark:text-white" to="/app/notifications">
                  <span className="material-symbols-outlined">notifications</span>
                </Link>
                <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-primary/10 dark:bg-slate-800 dark:text-white" onClick={handleLogout} type="button">
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col overflow-hidden lg:flex-row">
            <aside className="flex w-full flex-col gap-6 border-r border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-background-dark lg:w-72">
              <div>
                <h1 className="mb-1 text-base font-bold leading-normal text-slate-900 dark:text-white">Navigation</h1>
                <p className="text-xs font-normal text-slate-500 dark:text-slate-400">Manage your journey</p>
              </div>

              <div className="flex flex-col gap-1">
                <Link className="flex items-center gap-3 rounded-xl bg-primary px-3 py-2.5 text-white shadow-lg shadow-primary/20" to="/app/swaps">
                  <span className="material-symbols-outlined text-[20px]">map</span>
                  <span className="text-sm font-semibold">Map View</span>
                </Link>
                <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" to="/app/dashboard">
                  <span className="material-symbols-outlined text-[20px]">dashboard</span>
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
                <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" to="/app/notifications">
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  <span className="text-sm font-medium">Notifications</span>
                  <span className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {unreadCount}
                  </span>
                </Link>
                <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" to="/verify">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                  <span className="text-sm font-medium">Journey</span>
                </Link>
              </div>

              <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Status</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500" style={{ boxShadow: "0 0 8px rgba(34, 197, 94, 0.4)" }} />
                    <span className="text-xs text-slate-600 dark:text-slate-300">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-primary" style={{ boxShadow: "0 0 8px rgba(60, 131, 246, 0.6)" }} />
                    <span className="text-xs text-slate-600 dark:text-slate-300">Your Seat ({ownSeatNumber})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-500" style={{ boxShadow: "0 0 8px rgba(234, 179, 8, 0.4)" }} />
                    <span className="text-xs text-slate-600 dark:text-slate-300">Pending Swap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" style={{ boxShadow: "0 0 8px rgba(239, 68, 68, 0.4)" }} />
                    <span className="text-xs text-slate-600 dark:text-slate-300">Locked</span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-slate-900/30">
              <div className="flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center md:p-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {currentJourney.journey.coachOrBusNumber} - {currentJourney.journey.code}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Tap a seat to initiate a swap or view detailed passenger preferences.
                  </p>
                </div>
                <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <button className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-md" type="button">
                    Main Deck
                  </button>
                  <button className="rounded-lg px-4 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-primary dark:text-slate-400" type="button">
                    Upper Deck
                  </button>
                  <button className="rounded-lg px-4 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-primary dark:text-slate-400" type="button">
                    Lounge
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto px-6 pb-8 md:px-8">
                <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-background-dark">
                  <div className="absolute bottom-0 left-0 top-0 flex w-16 flex-col items-center justify-center gap-4 bg-slate-100 text-slate-300 dark:bg-slate-800/50 dark:text-slate-700">
                    <span className="[writing-mode:vertical-lr] rotate-180 text-xl font-bold uppercase">
                      Front of Coach
                    </span>
                  </div>

                  <div className="ml-16 space-y-6">
                    {rows.map((rowGroup, index) => (
                      <div key={rowGroup.row}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex gap-4">
                            {rowGroup.left.map((seat) => (
                              <button
                                key={seat.id}
                                className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-transform hover:scale-105 ${seatClasses(seat)}`}
                                onClick={() =>
                                  setSelectedSeat({
                                    ...seat,
                                    mySeatNumber: ownSeatNumber
                                  })
                                }
                                type="button"
                              >
                                <span className="text-[10px] font-bold">{seat.seatNumber}</span>
                              </button>
                            ))}
                          </div>

                          <div className="mx-2 h-px flex-1 border-t border-dashed border-slate-200 dark:border-slate-800" />

                          <div className="flex gap-4">
                            {rowGroup.right.map((seat) => (
                              <button
                                key={seat.id}
                                className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-transform hover:scale-105 ${seatClasses(seat)}`}
                                onClick={() =>
                                  setSelectedSeat({
                                    ...seat,
                                    mySeatNumber: ownSeatNumber
                                  })
                                }
                                type="button"
                              >
                                <span className="text-[10px] font-bold">{seat.seatNumber}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {index === Math.floor(rows.length / 2) - 1 ? (
                          <div className="mb-6 mt-6 flex h-10 items-center justify-center border-y border-dashed border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-300 dark:text-slate-700">
                              Main Aisle
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-background-dark">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">airline_seat_recline_extra</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Your Selection</p>
                      <p className="font-bold">Seat {ownSeatNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-background-dark">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                      <span className="material-symbols-outlined">group</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Incoming Requests</p>
                      <p className="font-bold">{incoming.length} live offers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-background-dark">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
                      <span className="material-symbols-outlined">stars</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Outgoing Requests</p>
                      <p className="font-bold">{outgoing.length} active requests</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="flex w-full flex-col gap-6 border-l border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-background-dark lg:w-80">
              <div>
                <h2 className="mb-1 text-base font-bold leading-normal text-slate-900 dark:text-white">
                  Swap Requests
                </h2>
                <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  Incoming offers from passengers
                </p>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto">
                {(isLoading ? [] : incoming).length ? (
                  incoming.map((request, index) => (
                    <div
                      key={request.id}
                      className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all dark:border-slate-700 dark:bg-slate-800/30 ${request.status === "expired" ? "opacity-60" : "hover:border-primary/50"}`}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${index % 3 === 0 ? "from-primary/40 to-primary/80" : index % 3 === 1 ? "from-slate-400 to-slate-600" : "from-amber-400 to-orange-600"} text-xs font-bold text-white`}>
                          {request.requester.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{request.requester.name}</p>
                          <p className="text-[10px] text-slate-500">
                            Seat {request.requester.seat.number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-primary">{request.status.toUpperCase()}</p>
                          <p className="text-[10px] text-slate-500">{request.journey.type}</p>
                        </div>
                      </div>

                      {request.message ? (
                        <div className="mb-4 rounded-xl border border-slate-100 bg-white p-3 text-xs italic text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                          &quot;{request.message}&quot;
                        </div>
                      ) : null}

                      <div className="flex gap-2">
                        {requestActionLabel(request, true) ? (
                          <button
                            className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90"
                            onClick={() => handlePrimaryRequestAction(request, true)}
                            type="button"
                          >
                            {requestActionLabel(request, true)}
                          </button>
                        ) : null}
                        {request.canReject ? (
                          <button
                            className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-bold transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                            onClick={() => handleSecondaryRequestAction(request)}
                            type="button"
                          >
                            Decline
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400">
                    No incoming swap requests yet.
                  </div>
                )}
              </div>

              <div className="mt-auto border-t border-slate-200 pt-6 dark:border-slate-800">
                {featuredRequest ? (
                  <div
                    className="max-w-xs rounded-xl border-l-4 border-l-primary p-5"
                    style={{
                      background: "rgba(16, 23, 34, 0.8)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      borderTop: "1px solid rgba(60, 131, 246, 0.2)",
                      borderRight: "1px solid rgba(60, 131, 246, 0.2)",
                      borderBottom: "1px solid rgba(60, 131, 246, 0.2)",
                      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.8)"
                    }}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">handshake</span>
                      <span className="font-bold text-slate-200">Pending Consent</span>
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-slate-400">
                      The other passenger has responded for <strong>seat {featuredRequest.receiver.seat.number}</strong>.
                      Confirm to finalize the exchange.
                    </p>
                    <div className="flex gap-2">
                      {requestActionLabel(featuredRequest, false) ? (
                        <button
                          className="h-9 flex-1 rounded bg-primary text-xs font-bold text-white transition-all hover:brightness-110"
                          onClick={() => handlePrimaryRequestAction(featuredRequest, false)}
                          type="button"
                        >
                          {requestActionLabel(featuredRequest, false)}
                        </button>
                      ) : null}
                      {featuredRequest.canCancel ? (
                        <button
                          className="h-9 flex-1 rounded border border-slate-700 text-xs font-medium text-slate-400 transition-all hover:bg-slate-800"
                          onClick={() => handlePrimaryRequestAction(featuredRequest, false)}
                          type="button"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400">
                    Route progress is being tracked. New requests will appear here as other verified passengers join.
                  </div>
                )}
              </div>
            </aside>
          </main>
        </div>
      </div>

      <SwapRequestModal
        isSubmitting={isSending}
        onClose={() => setSelectedSeat(null)}
        onSubmit={handleCreateRequest}
        open={Boolean(selectedSeat)}
        seat={selectedSeat}
      />
    </div>
  );
}

export default SwapRequestsPage;
