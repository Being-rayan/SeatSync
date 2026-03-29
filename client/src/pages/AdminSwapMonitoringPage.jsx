import { useState } from "react";
import AppShell from "../layouts/AppShell";
import EmptyState from "../components/EmptyState";
import LoadingScreen from "../components/LoadingScreen";
import StatusBadge from "../components/StatusBadge";
import usePolling from "../hooks/usePolling";
import { getAdminSwaps } from "../services/adminService";
import { getNotifications } from "../services/notificationService";

function AdminSwapMonitoringPage() {
  const [filters, setFilters] = useState({
    status: "",
    coachOrBusNumber: "",
    journeyId: ""
  });
  const [swaps, setSwaps] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSwaps = async () => {
    try {
      const [swapData, notificationData] = await Promise.all([
        getAdminSwaps(filters),
        getNotifications()
      ]);

      setSwaps(swapData);
      setNotifications(notificationData);
    } finally {
      setIsLoading(false);
    }
  };

  usePolling(loadSwaps, 8000, true, true);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  if (isLoading) {
    return <LoadingScreen label="Loading swap monitoring" />;
  }

  return (
    <AppShell
      subtitle="Monitor all request states, coach filters, and final-consent progress."
      title="Swap Monitoring"
      unreadCount={unreadCount}
    >
      <div className="stack-page">
        <section className="section-card">
          <div className="section-card__header">
            <div>
              <span className="eyebrow">Filters</span>
              <h2>Swap request monitoring</h2>
            </div>
          </div>

          <div className="form-grid form-grid--compact">
            <label className="field">
              <span>Status</span>
              <select
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value }))
                }
                value={filters.status}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
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
            <label className="field">
              <span>Journey id</span>
              <input
                onChange={(event) =>
                  setFilters((current) => ({ ...current, journeyId: event.target.value }))
                }
                type="number"
                value={filters.journeyId}
              />
            </label>
          </div>
        </section>

        <section className="section-card">
          <div className="section-card__header">
            <div>
              <span className="eyebrow">Requests</span>
              <h2>{swaps.length} swap records</h2>
            </div>
          </div>

          {swaps.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Journey</th>
                    <th>Coach</th>
                    <th>Requester</th>
                    <th>Receiver</th>
                    <th>Seats</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {swaps.map((swap) => (
                    <tr key={swap.id}>
                      <td>{swap.journey_code}</td>
                      <td>{swap.coach_or_bus_number}</td>
                      <td>{swap.requester_name}</td>
                      <td>{swap.receiver_name}</td>
                      <td>
                        {swap.from_seat_number} to {swap.to_seat_number}
                      </td>
                      <td>
                        <StatusBadge value={swap.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState body="There are no swap records for the current filter set." title="No swaps found" />
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default AdminSwapMonitoringPage;
