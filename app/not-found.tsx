import Link from "next/link";
import { RootwiseLogo } from "@/components/ui/rootwise-logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 font-sans text-center">
      <div className="card max-w-sm w-full p-8 space-y-4">
        <div className="flex justify-center mb-2">
          <RootwiseLogo variant="icon" size={36} />
        </div>
        <h1 className="text-3xl font-mono font-bold text-text-primary">404</h1>
        <p className="text-xs text-text-tertiary">
          The page or course you requested could not be found.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 bg-lime-300 text-[#0A0A0A] text-xs font-bold rounded-lg hover:bg-lime-400 transition-colors shadow-sm"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
