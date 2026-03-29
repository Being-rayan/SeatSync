function LoadingScreen({ label = "Loading SeatSync" }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-dark px-6 font-display text-slate-100">
      <div
        className="flex w-full max-w-sm flex-col items-center rounded-[2rem] p-8 text-center"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)"
        }}
      >
        <div className="h-14 w-14 animate-spin rounded-full border-[5px] border-primary/15 border-t-primary" />
        <p className="mt-5 text-sm font-medium text-slate-300">{label}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
