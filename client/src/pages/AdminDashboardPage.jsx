import { useState } from "react";
import AppShell from "../layouts/AppShell";
import AnalyticsCard from "../components/AnalyticsCard";
import EmptyState from "../components/EmptyState";
import LoadingScreen from "../components/LoadingScreen";
import { useToast } from "../context/ToastContext";
import usePolling from "../hooks/usePolling";
import {
  getAdminAnalytics,
  getAdminSeats,
  getAdminUsers,
  lockSeat,
  unlockSeat
} from "../services/adminService";
import { getNotifications } from "../services/notificationService";
import { getApiErrorMessage } from "../utils/apiError";

function AdminDashboardPage() {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [seats, setSeats] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const [analyticsData, usersData, seatsData, notificationsData] = await Promise.all([
        getAdminAnalytics(),
        getAdminUsers(),
        getAdminSeats(),
        getNotifications()
      ]);

      setAnalytics(analyticsData);
      setUsers(usersData);
      setSeats(seatsData.slice(0, 8));
      setNotifications(notificationsData);
    } finally {
      setIsLoading(false);
    }
  };

  usePolling(loadDashboard, 9000, true, true);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleSeatToggle = async (seat) => {
    try {
      if (seat.is_locked) {
        await unlockSeat(seat.id);
      } else {
        await lockSeat(seat.id);
      }

      await loadDashboard();
      showToast({
        tone: "success",
        title: seat.is_locked ? "Seat unlocked" : "Seat locked",
        message: `Seat ${seat.seat_number} was updated successfully.`
      });
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Seat update failed",
        message: getApiErrorMessage(error, "Please try again.")
      });
    }
  };

  if (isLoading || !analytics) {
    return <LoadingScreen label="Loading admin overview" />;
  }

  return (
    <AppShell
      subtitle="Monitor journey volume, passengers, seat locks, and swap activity from one console."
      title="Admin Overview"
      unreadCount={unreadCount}
    >
      <div className="stack-page">
        <div className="analytics-grid">
          <AnalyticsCard accent="brand" label="Total journeys" value={analytics.totalJourneys} />
          <AnalyticsCard accent="info" label="Total users" value={analytics.totalUsers} />
          <AnalyticsCard accent="warning" label="Pending requests" value={analytics.pendingRequests} />
          <AnalyticsCard accent="success" label="Completed swaps" value={analytics.completedSwaps} />
        </div>

        <div className="dashboard-grid">
          <section className="section-card">
            <div className="section-card__header">
              <div>
                <span className="eyebrow">Passengers</span>
                <h2>Recent user records</h2>
              </div>
            </div>

            {users.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Verified journeys</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 8).map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.email}</td>
                        <td>{item.role}</td>
                        <td>{item.verifiedJourneyCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState body="Passenger accounts will appear here." title="No user records" />
            )}
          </section>

          <section className="section-card">
            <div className="section-card__header">
              <div>
                <span className="eyebrow">Seat control</span>
                <h2>Recent seats</h2>
              </div>
            </div>

            {seats.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Seat</th>
                      <th>Journey</th>
                      <th>Passenger</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seats.map((seat) => (
                      <tr key={seat.id}>
                        <td>{seat.seat_number}</td>
                        <td>{seat.journey_code}</td>
                        <td>{seat.passenger_name || "Vacant"}</td>
                        <td>{seat.is_locked ? "Locked" : "Open"}</td>
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
              <EmptyState body="Seat-level admin controls will appear here." title="No seats loaded" />
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export default AdminDashboardPage;
