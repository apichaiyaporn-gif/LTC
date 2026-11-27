import { useEffect, useState } from "react";

/* The wait is a tour: while the first build streams, rotate real Launchpad
   tips so the time teaches something. Every line must stay TRUE — this is
   product copy the user reads a dozen times. */
const TIPS = [
  "Undo is free — every build turn leaves a rewind point.",
  "Mention @lumi in chat for a design polish pass.",
  "Drop an image into the chat to use it as a visual reference.",
  "Chat mode answers questions without spending build credits.",
  "Publishing to a live URL is free on every plan.",
  "Your code is a real Vite repo — export it anytime, it runs anywhere.",
  "Stock photography is free; the agent can pull it into any build.",
];

export default function App() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % TIPS.length), 3600);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-40%] opacity-40 blur-3xl"
        style={{
          background:
            "linear-gradient(115deg, #598bff, #8468ff, #ef63c4, #ff7d47, #8468ff, #598bff)",
          backgroundSize: "300% 300%",
          animation: "lp-aurora 7s ease-in-out infinite",
        }}
      />
      <style>{`@keyframes lp-aurora { 0%, 100% { background-position: 0% 40%; } 50% { background-position: 100% 60%; } }
@keyframes lp-word { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="relative max-w-[44ch] px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Ready to build.</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
          Describe a change and this page will become it.
        </p>
        <div className="mx-auto mt-8 max-w-[40ch] rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 px-5 py-4 text-left backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            While you wait
          </p>
          <p
            key={i}
            className="mt-1.5 text-[14px] leading-relaxed"
            style={{ animation: "lp-word 0.45s ease-out" }}
          >
            {TIPS[i]}
          </p>
        </div>
      </div>
    </main>
  );
}
