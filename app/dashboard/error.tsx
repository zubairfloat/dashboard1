"use client";
export default function DashboardError({ reset }: { reset: () => void }) {
  return <div role="alert" className="m-6 rounded-2xl border border-rose-300/20 bg-blue-950 p-6 text-white"><h2 className="text-xl font-semibold">Unable to load the dashboard</h2><p className="mt-2 text-blue-100">Please check your connection and try again.</p><button onClick={reset} className="mt-4 rounded-xl bg-white/10 px-4 py-2">Try again</button></div>;
}
