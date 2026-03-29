import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundColor: "#101722",
          backgroundImage:
            "radial-gradient(at 0% 0%, rgba(60, 131, 246, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 50%)"
        }}
      />

      <header className="fixed top-0 z-50 w-full px-6 py-4">
        <div
          className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-6 py-3"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }}
        >
          <div className="group flex cursor-pointer items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5">
              <span className="material-symbols-outlined text-2xl leading-none text-white">
                airline_seat_recline_extra
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SeatSync</h2>
          </div>

          <nav className="hidden items-center gap-10 md:flex">
            <a
              className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
              href="#how-it-works"
            >
              How it Works
            </a>
            <a
              className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
              href="#why-seatsync"
            >
              Why SeatSync
            </a>
            <a
              className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
              href="#cta"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link className="hidden px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:block" to="/login">
              Log In
            </Link>
            <Link
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-95 hover:bg-primary/90"
              to="/register"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-28">
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Live Exchange Active</span>
            </div>

            <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white lg:text-7xl">
              Swap Seats, <br />
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Stress-Free.
              </span>
            </h1>

            <p className="max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-400 lg:text-xl">
              Experience the future of travel with real-time seat exchange. Upgrade your
              journey or find a window seat in seconds with our secure peer-to-peer platform.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-xl shadow-primary/30 transition-all active:scale-95 hover:bg-primary/90"
                to="/register"
              >
                Start Swapping <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link
                className="flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-bold text-slate-900 transition-all hover:bg-white/10 dark:text-white"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}
                to="/login"
              >
                View Demo
              </Link>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                <img
                  alt="User avatar 1"
                  className="h-10 w-10 rounded-full border-2 border-background-dark"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuMKJZw2WsBAFfo2YZS0bgPJ9aoop9ZV1bQROIG-KmZWYS3v41fawfVGdEUlMK-qczwleZU5WW3N77eK6uJmV99pj-w88mz7aN-BBJ9T5lmOMZ4hd0s8r0UOTmrj2jV_BsDHPENLWrUxNHeCKiDWFwLfZ_hS6tvWLKBdrzSh8lXDNLMmuyEcRYt1TA3cnTXBi1G1O5l5mgivPrAoj2c-lli9KBsveY-eh1TJ85PCv180cXO332R1PrIMZBTDLy87cUz_Lt73lsCLU"
                />
                <img
                  alt="User avatar 2"
                  className="h-10 w-10 rounded-full border-2 border-background-dark"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEc7ExBjtK-ww8s6FpE9aXS7MdF2bOriymXqNJ_xhTU4SXzUd_efqQydLTbZYKSLKg7bQy2jgcimLPphen-hWy0dTJ4HcU825XeZsw4BuniTcvDp2CYaAKnE_4MZo9Fb_74t2evI9tEASZX1jzz049lObjSDmi3kThMSpHPRKWzT3jH_pbX4JDokCJztfiFoS0WFueb51adAn7Tjbv3WLQXjI1qUoSqohL55hDQCno-mXRl8H9D4AAoO8kEoPM18Gu3yJhrE8A56Y"
                />
                <img
                  alt="User avatar 3"
                  className="h-10 w-10 rounded-full border-2 border-background-dark"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3rCI27oNpyiAejcli3gHNgL6cJvfHe5Q8vHM0H8qnKZQW0faspsZeaIuC7-L_xqgK1EKB4GKJZHIsoXXa4LBV3ZmZW4D2yUA39P_RBh4EpMBfO6a7kDFHqGmW55c62pdcEe3rk5RYPL6yMl9K20L8ElcqvsT6G50JrgBJaO7xhFpVud0Ujd4tN75pZOrtaaUZFbe7tkb6UICW9YiFvgioV2oEmMVEqeN9zdSV4hDPIeUupfqWcC2jqeF2rSM-X4BpvGKaTZYN-x0"
                />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Trusted by <span className="font-bold text-slate-900 dark:text-white">12,000+</span>{" "}
                travelers worldwide
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-primary/20 blur-3xl" />
            <div
              className="relative overflow-hidden rounded-[2.5rem] p-4 shadow-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
            >
              <img
                alt="Modern bus interior with premium lighting"
                className="aspect-[4/3] w-full rounded-[2rem] object-cover opacity-90"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZOgTX3tJZqQbURqaT8qYCGygxJ6vkAlrx8dPEDUQJtJV4WTSCQ3KZROnMzpNjUj3_uZpAQO_6O2inkAFkFGNREwgIOE6aS1DIbGYV53AUS-neoLaBF-2-W53O5inpFUehWXS7fz4atgQELr95RqW5vffRYGWLjBrjS2G738ZQu7bHx6xJpWqwrBCIjoEn_t7cQmkrZxlP-tCtRFLWrPlC9ZiC0JpMrhfnvL2hMX4joyptiAjD67apI1in8eFrJvTrNYPzmcDw1Hc"
              />
              <div
                className="absolute bottom-10 left-10 right-10 flex items-center justify-between rounded-2xl p-6"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}
              >
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Incoming Request</p>
                  <p className="text-lg font-bold leading-none text-white">
                    Seat 12A <span className="mx-2 text-slate-400">{"\u2192"}</span> Seat 4C
                  </p>
                </div>
                <button className="rounded-full bg-emerald-500 p-3 text-white shadow-lg shadow-emerald-500/20" type="button">
                  <span className="material-symbols-outlined">check</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-100/50 px-6 py-24 dark:bg-slate-900/30" id="how-it-works">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold lg:text-4xl">How it Works</h2>
              <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-400">
                Three simple steps to unlock a more comfortable travel experience.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                ["verified_user", "1. Verify", "Securely link your ticket. We verify your current seat and route details automatically."],
                ["touch_app", "2. Select", "Browse available seats or post your own preference. Filter by window, aisle, or premium upgrades."],
                ["sync_alt", "3. Swap", "Once both parties agree, your digital boarding pass is updated instantly. Move and enjoy!"]
              ].map(([icon, title, text]) => (
                <div
                  key={title}
                  className="group relative rounded-3xl p-8 transition-all hover:-translate-y-2"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)"
                  }}
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                    <span className="material-symbols-outlined text-3xl">{icon}</span>
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{title}</h3>
                  <p className="leading-relaxed text-slate-600 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24" id="why-seatsync">
          <div className="flex flex-col items-center gap-16 lg:flex-row">
            <div className="lg:w-1/2">
              <h2 className="mb-8 text-4xl font-black leading-tight lg:text-5xl">
                Why Choose <br />
                <span className="text-primary">SeatSync</span>
              </h2>
              <div className="space-y-8">
                {[
                  {
                    icon: "bolt",
                    wrapperClass: "bg-violet-500/10",
                    iconClass: "text-violet-500",
                    title: "Real-Time Sync",
                    text: "Instant updates across all devices for seamless swapping, even with low connectivity."
                  },
                  {
                    icon: "handshake",
                    wrapperClass: "bg-blue-500/10",
                    iconClass: "text-blue-500",
                    title: "Mutual Consent",
                    text: "Both parties must agree, ensuring a fair, safe, and transparent experience every time."
                  },
                  {
                    icon: "workspace_premium",
                    wrapperClass: "bg-amber-500/10",
                    iconClass: "text-amber-500",
                    title: "Premium Comfort",
                    text: "Easily access last-minute upgrades from other travelers when a better seat match exists."
                  }
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-6">
                    <div className={`rounded-xl p-3 ${item.wrapperClass}`}>
                      <span className={`material-symbols-outlined ${item.iconClass}`}>{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="mb-1 text-xl font-bold">{item.title}</h4>
                      <p className="text-slate-600 dark:text-slate-400">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group lg:w-1/2">
              <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-primary to-violet-600 blur opacity-25 transition-opacity group-hover:opacity-40" />
              <div
                className="relative aspect-square overflow-hidden rounded-[2.5rem]"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}
              >
                <img
                  alt="Passenger enjoying premium window seat on a train"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQ27JAeJMYyGeQXm3RfU8xKzVaZVDy_mFXoaE2rpW974FWUY-umKdMUaV-uR4JqDuh5m-rjcoN8pVH7Q75tbi3wRw-4yFJLRUSsOlqpy6_qE5mKc94usPMHDGpOa6BmlSlpGCeWNxI5r1vJ8bOKd_4c1w3KAEchNzKOPuPyf8_IHgj82Pyt4xCdfmZh1wC5bTiX-4NcRIF51u6wwT2RZtXXgxDtbxuzc218E7U17r_uFlQyMGApokN7Z2EdxmeOCyS2wZ3RJyGB_M"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 px-6 py-24 dark:border-white/5">
          <div className="mx-auto max-w-7xl">
            <p className="mb-12 text-center text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
              As Seen In
            </p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale transition-all dark:invert md:gap-24">
              {[
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDWC0GMQyGu3zg9l0FqY1ooeD14dT_y7bq1Xy4QMssBPj12TtEwkkwn6afSMte2ja9-aFNGwbFwiHtzCjqEjtl5MpFlWqpdgLwGnmJ6vnzOnjkvqW3exWp34iCPAYzKIYskWlfTc33wSJ7vNXp4UpZuyy2wGSvVrxsVhw5HSps1dZ7vMfTJUGbiQMVU6w0Iyel4UyA74vz8RL-zGe9_mAf2JoVOvh7WQHD1tFgS14JU58RNOgaeJfxa9DAAIJQ--FeK-QP3y2WBixI",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCm5TMNuEBd51KpM1oJog0ANFlHAKm2M8hYC3cBumdnhfDp5Eh346gPpiWYqCN0SeLmgzQvKgkuKJhRU3lb3vvBEQMxDKeJ4ZAy-cr-2j1N_WfMjp_bPq715HM-RVEZcrJ1_WgeiVB-ArTgVDOEm3mGIpe8fn5wCEWNrXHSpV4h6N3OSGWul9BRXjUHI5sGFl2t7VcGyI5gxNqoEmdrwrLVxMARpCj9z0P5PTdBWdWT17RYa5yA30ZI5ubeWAfZWVrudYChYMviqdo",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuA-xUNZ3XDzZyh8isbfUnefDzz-8GnBHHMocuGneNIbxg6C9B5HXUfXFhirmBT-5AKIZVpUFnKdBY0hH4X1bKfXJz3d_G7vpTbad93F_qfZ-tSk2fgojY5i0GbL5hxWEjBCigciWf6EvPMeVa7VbezrrZt7f-kM2R_g-D0T0bDshJa3qGchDk6jHnVBys39ca6k_4nSGZDGKTdbpdf6VWCAE9sOAzv3uHn8Kn3ySQgI5g8KJQZOKCyW4C8ZK6jh7v6OROnqXREhCUA",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCaR69PT-I-zHFLa6YK7hsiykhO_ArKDNB0qZNqjQY-2GS5ezcT6KR3bQXcTVPMv7jUKKPAwXxJWTkYGM1LBKEegptTxih9P36uBHGlFcdD3gkyjsPMZFeoreV00HI4ln475o92yFUeW-pvv1Ej1C49W1vJ3xTzOeX5sToPG_26JQdXMyK9ANkbu8dOYDwHNaXl8bYSsEyVge4uznt_okr_VBWYJoQNw_GcEKl5AcgXATPDhCUjJvfsXaOOgZv8Ll0BlboxbN5gl5I"
              ].map((src, index) => (
                <img
                  key={src}
                  alt={`Brand ${index + 1}`}
                  className="h-6"
                  src={src}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-6 py-24" id="cta">
          <div
            className="relative mx-auto max-w-7xl overflow-hidden rounded-[3rem] p-12 text-center lg:p-20"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            <div className="absolute right-0 top-0 h-64 w-64 bg-primary/10 blur-[100px]" />
            <div className="absolute bottom-0 left-0 h-64 w-64 bg-violet-500/10 blur-[100px]" />
            <h2 className="mb-6 text-4xl font-black leading-tight lg:text-5xl">
              Ready to upgrade your journey?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Join thousands of travelers who are making transit more comfortable, one seat
              at a time.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link className="rounded-2xl bg-primary px-10 py-5 text-lg font-bold text-white shadow-xl transition-all" to="/register">
                Get Started
              </Link>
              <Link className="rounded-2xl bg-slate-900 px-10 py-5 text-lg font-bold text-white transition-all dark:bg-white dark:text-slate-900" to="/login">
                Open Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 px-6 pb-10 pt-20 dark:border-white/5 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 grid gap-12 md:grid-cols-4">
            <div className="col-span-2">
              <div className="mb-6 flex items-center gap-2">
                <div className="rounded-md bg-primary p-1">
                  <span className="material-symbols-outlined text-xl text-white">airline_seat_recline_extra</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">SeatSync</h2>
              </div>
              <p className="max-w-xs leading-relaxed text-slate-600 dark:text-slate-400">
                The global standard for real-time peer-to-peer seat exchange. Changing the way
                the world travels.
              </p>
            </div>

            <div>
              <h4 className="mb-6 font-bold">Company</h4>
              <ul className="space-y-4 text-slate-600 dark:text-slate-400">
                <li><a className="transition-colors hover:text-primary" href="#why-seatsync">About Us</a></li>
                <li><a className="transition-colors hover:text-primary" href="#cta">Careers</a></li>
                <li><a className="transition-colors hover:text-primary" href="#cta">Press Kit</a></li>
                <li><a className="transition-colors hover:text-primary" href="#cta">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-6 font-bold">Product</h4>
              <ul className="space-y-4 text-slate-600 dark:text-slate-400">
                <li><a className="transition-colors hover:text-primary" href="#how-it-works">How it Works</a></li>
                <li><a className="transition-colors hover:text-primary" href="#cta">Pricing</a></li>
                <li><a className="transition-colors hover:text-primary" href="#cta">Enterprise</a></li>
                <li><a className="transition-colors hover:text-primary" href="#cta">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-6 border-t border-slate-200 pt-10 dark:border-white/5 md:flex-row">
            <p className="text-sm text-slate-500">{"\u00A9"} 2024 SeatSync Inc. All rights reserved.</p>
            <div className="flex gap-8">
              <a className="text-sm text-slate-500 transition-colors hover:text-primary" href="#cta">Privacy Policy</a>
              <a className="text-sm text-slate-500 transition-colors hover:text-primary" href="#cta">Terms of Service</a>
              <a className="text-sm text-slate-500 transition-colors hover:text-primary" href="#cta">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
