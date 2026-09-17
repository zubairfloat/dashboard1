import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { Clock3, UserRound } from "lucide-react";
import { getRequestTime, getManagedProfile } from "@/lib/dashboard-data";
import Countdown from "@/components/dashboard/countdown";
import { StatusBadge } from "@/components/dashboard/ui";

export default async function ApprovalTimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getManagedProfile(id);
  const username = profile.username;
  const isApproved = profile.is_approved;
  const remainingTime = <Countdown deadline={profile.approval_deadline} initialNow={getRequestTime()} />;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="workspace-panel rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl md:p-8">
        <StatusBadge
          status={isApproved ? "approved" : "pending"}
          label={isApproved ? "Approved" : "Pending approval"}
        />
        <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">
          Approval Status
        </h1>
        <p className="mt-2 text-blue-100/70">
          View the stored approval countdown for this user.
        </p>
      </div>

      <section className="workspace-panel rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
        <div className="grid gap-5 md:grid-cols-3">
          <InfoCard icon={UserRound} label="Username" value={username || "User"} />
          <InfoCard icon={Clock3} label="Remaining Time" value={remainingTime} />
          <div className="workspace-panel rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-blue-100/60">Status</p>
            <div className="mt-3">
              <StatusBadge
                status={isApproved ? "approved" : "pending"}
                label={isApproved ? "Approved" : "Pending"}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-300/20 bg-blue-400/10 p-4 text-sm text-blue-100">
          {isApproved
            ? "This user account has been approved."
            : "This user is currently waiting for approval."}
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="workspace-panel rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-3 text-blue-100">
        <Icon size={20} />
        <p className="text-sm text-blue-100/60">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
