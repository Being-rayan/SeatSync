function SeatGrid({ seats, onSeatSelect }) {
  const maxX = Math.max(...seats.map((seat) => seat.layoutX), 1);
  const maxY = Math.max(...seats.map((seat) => seat.layoutY), 1);

  return (
    <div className="seat-grid-wrapper">
      <div
        className="seat-grid"
        style={{
          gridTemplateColumns: `repeat(${maxX}, minmax(52px, 1fr))`,
          gridTemplateRows: `repeat(${maxY}, minmax(56px, 1fr))`
        }}
      >
        {seats.map((seat) => (
          <button
            key={seat.id}
            className={[
              "seat",
              `seat--${seat.primaryState}`,
              seat.isSwapped ? "seat--swapped" : ""
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onSeatSelect(seat)}
            style={{
              gridColumn: seat.layoutX,
              gridRow: seat.layoutY
            }}
            type="button"
          >
            <strong>{seat.seatNumber}</strong>
            <span>{seat.seatType}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SeatGrid;
