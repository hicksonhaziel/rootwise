"use client";

import { useEffect } from "react";
import { ArrowCounterClockwise } from "@phosphor-icons/react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Rootwise ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 font-sans text-center">
      <div className="card max-w-md w-full p-6 space-y-4">
        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto text-sm font-mono font-bold">
          !
        </div>
        <h2 className="text-base font-semibold text-text-primary">
          Something went wrong
        </h2>
        <p className="text-xs text-text-tertiary leading-relaxed">
          {error.message || "An unexpected error occurred while rendering this page."}
        </p>
        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-lime-300 text-[#0A0A0A] text-xs font-bold rounded-lg hover:bg-lime-400 transition-colors shadow-sm"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
