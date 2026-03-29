import { useEffect, useState } from "react";

function SwapRequestModal({ seat, open, onClose, onSubmit, isSubmitting }) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage("");
  }, [seat?.id]);

  if (!open || !seat) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl"
        style={{
          background: "rgba(16, 23, 34, 0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(60, 131, 246, 0.2)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.8)"
        }}
      >
        <div className="flex items-center justify-between border-b border-primary/10 p-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Request Seat Swap</h2>
          <button className="text-slate-400 transition-colors hover:text-white" onClick={onClose} type="button">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">
          <div className="relative flex items-center justify-between gap-4 py-8">
            <div className="flex flex-1 flex-col items-center gap-3">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-primary bg-primary/20"
                style={{ boxShadow: "0 0 20px rgba(60, 131, 246, 0.4)" }}
              >
                <span className="material-symbols-outlined text-4xl text-primary">event_seat</span>
              </div>
              <div className="text-center">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">Your Seat</p>
                <h3 className="text-lg font-bold leading-tight text-slate-100">{seat.mySeatNumber}</h3>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <span className="material-symbols-outlined relative z-10 text-2xl text-primary">
                  swap_horiz
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center gap-3">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-yellow-500 bg-yellow-500/20"
                style={{ boxShadow: "0 0 20px rgba(234, 179, 8, 0.4)" }}
              >
                <span className="material-symbols-outlined text-4xl text-yellow-500">event_seat</span>
              </div>
              <div className="text-center">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-yellow-500">Target Seat</p>
                <h3 className="text-lg font-bold leading-tight text-slate-100">{seat.seatNumber}</h3>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-400">Message (Optional)</span>
              <textarea
                className="min-h-28 w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-slate-100 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                maxLength={280}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="I'd love to swap my seat with yours if you're interested."
                value={message}
              />
            </label>

            <div className="flex items-start gap-3 rounded-lg border border-primary/10 bg-primary/5 p-4">
              <span className="material-symbols-outlined text-xl text-primary">info</span>
              <p className="text-xs leading-relaxed text-slate-400">
                Sending a request doesn&apos;t guarantee a swap. The other passenger must accept,
                and then both sides must give final digital consent before the exchange is completed.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary/10 bg-slate-900/30 p-6">
          <button
            className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary via-indigo-500 to-purple-600 text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98]"
            disabled={isSubmitting}
            onClick={() => onSubmit(message)}
            type="button"
          >
            <span>{isSubmitting ? "Sending..." : "Send Swap Request"}</span>
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SwapRequestModal;
