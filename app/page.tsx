import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-bold">
            Axnetix Dashboard 🚀
          </h1>

          <div className="hidden gap-10 md:flex">
            <a href="#">Home</a>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Contact</a>
          </div>

          <div className="flex gap-4">
            <Link
              href="/login"
              className="rounded-lg border border-white/20 px-5 py-2 transition hover:bg-white/10"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-lg bg-white px-5 py-2 font-medium text-blue-900"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.25),transparent_70%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-32 text-center">
          <div className="mb-8 inline-flex rounded-full border border-white/20 px-5 py-2 text-sm backdrop-blur-md">
            Modern Axnetix Platform
          </div>

          <h1 className="text-6xl font-extrabold leading-tight md:text-8xl">
            Manage Your Business
            <br />
            <span className="text-blue-200">
              From One Dashboard
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-xl text-blue-100/80">
            Manage packages, subscriptions, tokens, users and
            future Axnetix modules from a single powerful platform.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-xl bg-white px-8 py-4 font-semibold text-blue-900 shadow-lg"
            >
              Get Started
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-white/20 px-8 py-4 backdrop-blur-md"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <h3 className="text-5xl font-bold">
              10K+
            </h3>

            <p className="mt-2 text-blue-100/70">
              Tokens Managed
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <h3 className="text-5xl font-bold">
              500+
            </h3>

            <p className="mt-2 text-blue-100/70">
              Active Users
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <h3 className="text-5xl font-bold">
              99.9%
            </h3>

            <p className="mt-2 text-blue-100/70">
              Uptime
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-bold">
            Everything You Need
          </h2>

          <p className="mt-4 text-blue-100/70">
            Built for modern Axnetix businesses.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <h3 className="mb-4 text-2xl font-semibold">
              Authentication
            </h3>

            <p className="text-blue-100/70">
              Secure login, signup and Google authentication.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <h3 className="mb-4 text-2xl font-semibold">
              Packages
            </h3>

            <p className="text-blue-100/70">
              Manage subscriptions and billing plans.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <h3 className="mb-4 text-2xl font-semibold">
              Tokens
            </h3>

            <p className="text-blue-100/70">
              Monitor usage and balance tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-blue-100/60">
        © 2026 Axnetix Dashboard. All rights reserved.
      </footer>
    </main>
  );
}