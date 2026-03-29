import { formatDateTime, formatRelativeCountdown } from "../utils/formatters";
import StatusBadge from "./StatusBadge";

function SwapRequestCard({
  request,
  onAccept,
  onReject,
  onCancel,
  onConfirm
}) {
  return (
    <article className="request-card">
      <div className="request-card__header">
        <div>
          <span className="eyebrow">{request.journey.code}</span>
          <h3>
            {request.requester.seat.number} to {request.receiver.seat.number}
          </h3>
        </div>
        <StatusBadge value={request.stage} />
      </div>

      <div className="request-card__meta">
        <span>Requester: {request.requester.name}</span>
        <span>Receiver: {request.receiver.name}</span>
        <span>Coach / bus: {request.journey.coachOrBusNumber}</span>
      </div>

      <p className="request-card__message">{request.message || "No note was attached to this request."}</p>

      <div className="request-card__footer">
        <div>
          <small>Created {formatDateTime(request.createdAt)}</small>
          <small>{formatRelativeCountdown(request.expiresAt)}</small>
        </div>

        <div className="request-card__actions">
          {request.canAccept ? (
            <button className="button button--brand" onClick={() => onAccept(request.id)} type="button">
              Accept
            </button>
          ) : null}
          {request.canReject ? (
            <button className="button button--ghost" onClick={() => onReject(request.id)} type="button">
              Reject
            </button>
          ) : null}
          {request.canCancel ? (
            <button className="button button--ghost" onClick={() => onCancel(request.id)} type="button">
              Cancel
            </button>
          ) : null}
          {request.canFinalConfirm ? (
            <button className="button button--brand" onClick={() => onConfirm(request.id)} type="button">
              Final confirm
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default SwapRequestCard;
