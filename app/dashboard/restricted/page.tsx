import { LifeBuoy, ShieldOff } from "lucide-react";

export default function RestrictedPage() {
  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-2xl border border-rose-300/25 bg-rose-500/10 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur-xl md:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-300/15 text-rose-100">
          <ShieldOff size={26} />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-white md:text-4xl">
          Account Access Disabled
        </h1>

        <p className="mt-4 text-rose-100/85">
          Your Axnetix Network account access has been disabled by the
          administration team. Dashboard features are unavailable until support
          reviews and restores your account.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-100">
              <LifeBuoy size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Contact support</h2>
              <p className="mt-1 text-sm text-blue-100/70">
                Email info@axnetix.com if you believe this is an error or need
                an account review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
