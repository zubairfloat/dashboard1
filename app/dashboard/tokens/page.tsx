export default function TokensPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">
          Tokens
        </h1>

        <p className="mt-2 text-blue-100/70">
          Monitor token usage, balances and consumption.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm text-blue-100/60">
            Total Tokens
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            10,000
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm text-blue-100/60">
            Used Tokens
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            2,750
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm text-blue-100/60">
            Remaining Tokens
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            7,250
          </p>
        </div>
      </div>

      {/* Usage */}
      <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">
            Token Usage
          </h2>

          <span className="text-blue-100/70">
            27.5%
          </span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[27.5%] rounded-full bg-white" />
        </div>

        <p className="mt-4 text-sm text-blue-100/60">
          2,750 of 10,000 tokens have been used.
        </p>
      </div>

      {/* Recent Usage */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">
            Recent Activity
          </h2>

          <button className="rounded-xl bg-white px-5 py-2 font-medium text-blue-900 transition hover:bg-slate-200">
            Buy Tokens
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-4 text-blue-100/60">
                  Date
                </th>

                <th className="pb-4 text-blue-100/60">
                  Activity
                </th>

                <th className="pb-4 text-blue-100/60">
                  Tokens
                </th>

                <th className="pb-4 text-blue-100/60">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="py-8 text-center text-blue-100/60"
                >
                  No token activity found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}