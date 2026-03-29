import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { verifyJourney } from "../services/journeyService";
import { getApiErrorMessage } from "../utils/apiError";

const samples = [
  {
    journeyType: "train",
    reference: "PNR-900111",
    passengerName: "Ishaan Kapoor",
    journeyDate: "2026-04-22",
    coachOrBusNumber: "S1",
    assignedSeatNumber: "5D",
    boardingPoint: "New Delhi",
    destinationPoint: "Bhopal"
  },
  {
    journeyType: "train",
    reference: "TKT-220701",
    passengerName: "Ananya Roy",
    journeyDate: "2026-04-23",
    coachOrBusNumber: "C2",
    assignedSeatNumber: "3A",
    boardingPoint: "Mumbai Central",
    destinationPoint: "Vadodara"
  },
  {
    journeyType: "bus",
    reference: "BUS-884401",
    passengerName: "Rahul Verma",
    journeyDate: "2026-04-24",
    coachOrBusNumber: "B7",
    assignedSeatNumber: "2A",
    boardingPoint: "Indiranagar",
    destinationPoint: "Electronic City"
  }
];

function JourneyVerificationPage() {
  const navigate = useNavigate();
  const { setCurrentJourney, user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    journeyType: "train",
    reference: "",
    passengerName: "",
    journeyDate: "",
    coachOrBusNumber: "",
    assignedSeatNumber: "",
    boardingPoint: "",
    destinationPoint: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user?.role === "admin") {
    return <Navigate replace to="/admin" />;
  }

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const applySample = (sample) => {
    setForm({ ...sample });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const data = await verifyJourney(form);
      setCurrentJourney(data);
      navigate("/app/dashboard");
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Verification failed",
        message: getApiErrorMessage(error, "Please match one of the seeded journey credentials.")
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background-dark font-display text-slate-100">
      <div
        className="min-h-screen bg-background-dark"
        style={{
          backgroundImage:
            "radial-gradient(at 0% 0%, rgba(60, 131, 246, 0.18) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.14) 0px, transparent 50%)"
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex items-center justify-between">
            <Link className="text-sm font-bold text-primary" to="/">
              ← Back to home
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <form
              className="rounded-[2rem] p-8"
              onSubmit={handleSubmit}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
            >
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Journey Verification</span>
              <h1 className="mt-4 text-4xl font-black tracking-tight">Unlock Your Seat Map</h1>
              <p className="mt-3 text-slate-400">
                Only verified passengers in the same coach or bus can exchange seats.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Journey type</span>
                  <select
                    className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-slate-100 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/40"
                    onChange={updateField("journeyType")}
                    value={form.journeyType}
                  >
                    <option value="train">Train</option>
                    <option value="bus">Bus</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">PNR / ticket / booking ref</span>
                  <input className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-slate-100 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/40" onChange={updateField("reference")} required type="text" value={form.reference} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Passenger name</span>
                  <input className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-slate-100 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/40" onChange={updateField("passengerName")} required type="text" value={form.passengerName} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Date of journey</span>
                  <input className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-slate-100 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/40" onChange={updateField("journeyDate")} required type="date" value={form.journeyDate} />
                  <span className="mt-2 block text-xs text-slate-500">
                    Use the exact sample date. Your browser may display it in a local format like DD-MM-YYYY.
                  </span>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Coach / bus number</span>
                  <input className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-slate-100 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/40" onChange={updateField("coachOrBusNumber")} required type="text" value={form.coachOrBusNumber} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Assigned seat number</span>
                  <input className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-slate-100 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/40" onChange={updateField("assignedSeatNumber")} required type="text" value={form.assignedSeatNumber} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Boarding point</span>
                  <input className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-slate-100 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/40" onChange={updateField("boardingPoint")} required type="text" value={form.boardingPoint} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Destination point</span>
                  <input className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-slate-100 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/40" onChange={updateField("destinationPoint")} required type="text" value={form.destinationPoint} />
                </label>
              </div>

              <button
                className="mt-8 h-14 rounded-xl bg-primary px-8 text-lg font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Verifying..." : "Verify Journey"}
              </button>
            </form>

            <div className="space-y-4">
              {samples.map((sample) => (
                <button
                  key={sample.reference}
                  className="block w-full rounded-[1.5rem] p-5 text-left transition-all hover:border-primary/40 hover:bg-white/[0.05]"
                  onClick={() => applySample(sample)}
                  type="button"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)"
                  }}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Sample Record</span>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {sample.reference} / {sample.passengerName} / {sample.journeyDate} / {sample.coachOrBusNumber} / {sample.assignedSeatNumber}
                  </p>
                  <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                    <p>Boarding: {sample.boardingPoint}</p>
                    <p>Destination: {sample.destinationPoint}</p>
                  </div>
                  <span className="mt-4 inline-flex rounded-full border border-primary/30 px-3 py-1 text-xs font-bold text-primary">
                    Use this sample
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JourneyVerificationPage;
