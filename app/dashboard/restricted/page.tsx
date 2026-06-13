export default function RestrictedPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="max-w-2xl rounded-3xl border border-red-500/30 bg-red-500/10 p-8">
        <h1 className="text-4xl font-bold text-red-300">
          🚫 Account Access Restricted
        </h1>

        <p className="mt-4 text-red-100">
          Your Axnetix Network account has been restricted by our administration team.
        </p>

        <p className="mt-4 text-red-100">
          If you believe this is an error or would like your account reviewed,
          please contact support.
        </p>

        <div className="mt-6 rounded-xl bg-black/20 p-4">
          <p className="text-white">
            Email: info@axnetix.com
          </p>
        </div>

        <p className="mt-6 text-red-100">
          Our team will review your request and assist you as soon as possible.
        </p>
      </div>
    </div>
  );
}