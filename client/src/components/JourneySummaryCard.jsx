import { formatDate } from "../utils/formatters";

function JourneySummaryCard({ journey }) {
  if (!journey) {
    return null;
  }

  return (
    <section className="summary-card">
      <div>
        <span className="eyebrow">Current verified journey</span>
        <h2>{journey.journey.code}</h2>
        <p>
          {journey.journey.origin} to {journey.journey.destination} on{" "}
          {formatDate(journey.journey.date)}
        </p>
      </div>

      <div className="summary-card__grid">
        <div>
          <small>Assigned seat</small>
          <strong>{journey.assignedSeat?.number || "Pending"}</strong>
        </div>
        <div>
          <small>Coach / bus</small>
          <strong>{journey.journey.coachOrBusNumber}</strong>
        </div>
        <div>
          <small>Boarding</small>
          <strong>{journey.boardingPoint}</strong>
        </div>
        <div>
          <small>Destination</small>
          <strong>{journey.destinationPoint}</strong>
        </div>
      </div>
    </section>
  );
}

export default JourneySummaryCard;
