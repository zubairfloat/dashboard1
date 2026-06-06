"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function EmailConfirmedPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#10246e] via-[#2546b3] to-[#3d5afe] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 text-center backdrop-blur-xl">
        <CheckCircle
          size={70}
          className="mx-auto mb-4 text-green-400"
        />

        <h1 className="text-3xl font-bold text-white">
          Email Verified
        </h1>

        <p className="mt-3 text-blue-100/80">
          Your email has been verified successfully.
        </p>

        <p className="mt-2 text-blue-100/60">
          Redirecting to login page...
        </p>
      </div>
    </main>
  );
}