import { useState } from "react";
import AppShell from "../layouts/AppShell";
import EmptyState from "../components/EmptyState";
import LoadingScreen from "../components/LoadingScreen";
import { useToast } from "../context/ToastContext";
import usePolling from "../hooks/usePolling";
import {
  getAdminJourneys,
  getAdminSeats,
  lockSeat,
  unlockSeat
} from "../services/adminService";
import { getNotifications } from "../services/notificationService";
import { getApiErrorMessage } from "../utils/apiError";

function AdminJourneysPage() {
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    journeyType: "",
    journeyCode: "",
    coachOrBusNumber: ""
  });
  const [journeys, setJourneys] = useState([]);
  const [seats, setSeats] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [journeyData, seatData, notificationData] = await Promise.all([
        getAdminJourneys(filters),
        getAdminSeats(filters.coachOrBusNumber ? { coachOrBusNumber: filters.coachOrBusNumber } : {}),
        getNotifications()
      ]);

      setJourneys(journeyData);
      setSeats(seatData.slice(0, 12));
      setNotifications(notificationData);
    } finally {
      setIsLoading(false);
    }
  };

  usePolling(loadData, 10000, true, true);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleSeatToggle = async (seat) => {
    try {
      if (seat.is_locked) {
        await unlockSeat(seat.id);
      } else {
        await lockSeat(seat.id);
      }

      await loadData();
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Seat update failed",
        message: getApiErrorMessage(error, "Please try again.")
      });
    }
  };

  if (isLoading) {
    return <LoadingScreen label="Loading admin journeys" />;
  }

  return (
    <AppShell
      subtitle="Filter by journey type, journey code, or coach and inspect seat allocations."
      title="Journey Management"
      unreadCount={unreadCount}
    >
      <div className="stack-page">
        <section className="section-card">
          <div className="section-card__header">
            <div>
              <span className="eyebrow">Filters</span>
              <h2>Journey scope</h2>
            </div>
          </div>

          <div className="form-grid form-grid--compact">
            <label className="field">
              <span>Journey type</span>
              <select
                onChange={(event) =>
                  setFilters((current) => ({ ...current, journeyType: event.target.value }))
                }
                value={filters.journeyType}
              >
                <option value="">All</option>
                <option value="train">Train</option>
                <option value="bus">Bus</option>
              </select>
            </label>
            <label className="field">
              <span>Journey code</span>
              <input
                onChange={(event) =>
                  setFilters((current) => ({ ...current, journeyCode: event.target.value }))
                }
                type="text"
                value={filters.journeyCode}
              />
            </label>
            <label className="field">
              <span>Coach / bus</span>
              <input
                onChange={(event) =>
                  setFilters((current) => ({ ...current, coachOrBusNumber: event.target.value }))
                }
                type="text"
                value={filters.coachOrBusNumber}
              />
            </label>
          </div>
        </section>

        <section className="section-card">
          <div className="section-card__header">
            <div>
              <span className="eyebrow">Journeys</span>
              <h2>{journeys.length} matching routes</h2>
            </div>
          </div>

          {journeys.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Journey</th>
                    <th>Type</th>
                    <th>Coach</th>
                    <th>Passengers</th>
                    <th>Active swaps</th>
                    <th>Completed swaps</th>
                  </tr>
                </thead>
                <tbody>
                  {journeys.map((journey) => (
                    <tr key={journey.id}>
                      <td>{journey.journey_code}</td>
                      <td>{journey.journey_type}</td>
                      <td>{journey.coach_or_bus_number}</td>
                      <td>{journey.passenger_count}</td>
                      <td>{journey.active_swap_count}</td>
                      <td>{journey.completed_swap_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState body="Try relaxing the filters." title="No journeys match these filters" />
          )}
        </section>

        <section className="section-card">
          <div className="section-card__header">
            <div>
              <span className="eyebrow">Seats</span>
              <h2>Seat level controls</h2>
            </div>
          </div>

          {seats.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Seat</th>
                    <th>Journey</th>
                    <th>Occupant</th>
                    <th>Locked</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {seats.map((seat) => (
                    <tr key={seat.id}>
                      <td>{seat.seat_number}</td>
                      <td>{seat.journey_code}</td>
                      <td>{seat.passenger_name || "Vacant"}</td>
                      <td>{seat.is_locked ? "Yes" : "No"}</td>
                      <td>
                        <button
                          className="button button--ghost"
                          onClick={() => handleSeatToggle(seat)}
                          type="button"
                        >
                          {seat.is_locked ? "Unlock" : "Lock"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState body="Seat data will appear after filters resolve." title="No seat data" />
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default AdminJourneysPage;
