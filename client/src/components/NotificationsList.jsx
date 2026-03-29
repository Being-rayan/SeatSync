import { formatDateTime } from "../utils/formatters";

function NotificationsList({ items, onRead }) {
  return (
    <div className="notifications-list">
      {items.map((item) => (
        <article key={item.id} className={`notification-item ${item.isRead ? "notification-item--read" : ""}`}>
          <div>
            <span className="eyebrow">{item.type.replace(/_/g, " ")}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            <small>{formatDateTime(item.createdAt)}</small>
          </div>

          {!item.isRead ? (
            <button className="button button--ghost" onClick={() => onRead(item.id)} type="button">
              Mark read
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export default NotificationsList;
