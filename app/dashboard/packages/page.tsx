export default function PackagesPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">
          Packages
        </h1>

        <p className="mt-2 text-blue-100/70">
          Manage subscription packages and plans.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm text-blue-100/60">
            Total Packages
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            12
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm text-blue-100/60">
            Active
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            8
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm text-blue-100/60">
            Expired
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            4
          </p>
        </div>
      </div>

      {/* Packages Table */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">
            Package List
          </h2>

          <button className="rounded-xl bg-white px-5 py-2 font-medium text-blue-900 transition hover:bg-slate-200">
            + New Package
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-4 text-blue-100/60">
                  Package
                </th>

                <th className="pb-4 text-blue-100/60">
                  Status
                </th>

                <th className="pb-4 text-blue-100/60">
                  Tokens
                </th>

                <th className="pb-4 text-blue-100/60">
                  Price
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={4}
                  className="py-8 text-center text-blue-100/60"
                >
                  No packages found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}