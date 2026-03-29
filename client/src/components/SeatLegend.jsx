function SeatLegend() {
  const items = [
    { key: "mine", label: "Your seat" },
    { key: "available", label: "Available for swap" },
    { key: "pending", label: "Active request" },
    { key: "locked", label: "Admin locked" },
    { key: "occupied", label: "Occupied or not verified" },
    { key: "swapped", label: "Already swapped" }
  ];

  return (
    <div className="seat-legend">
      {items.map((item) => (
        <div key={item.key} className="seat-legend__item">
          <span className={`seat-legend__swatch seat-legend__swatch--${item.key}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default SeatLegend;
