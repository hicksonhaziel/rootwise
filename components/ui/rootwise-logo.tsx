/**
 * components/ui/rootwise-logo.tsx
 *
 * SVG logo component sourced from /public/rootwise-logo/
 * Supports the standalone mark or rounded container icon with wordmark.
 */

import { cn } from "@/lib/utils";

interface RootwiseLogoProps {
  size?: number;
  className?: string;
  variant?: "mark" | "icon" | "wordmark";
}

export function RootwiseLogo({
  size = 28,
  className,
  variant = "wordmark",
}: RootwiseLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {variant === "icon" ? (
        // Rounded lime badge variant
        <div
          className="rounded-lg bg-lime-300 flex items-center justify-center flex-shrink-0"
          style={{ width: size, height: size }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="80 70 352 410"
            width={size * 0.7}
            height={size * 0.7}
            aria-hidden="true"
          >
            <path
              fill="#0A0A0A"
              fillRule="evenodd"
              d="
                M 176 96
                C 250 84 340 92 372 124
                C 404 156 400 220 380 262
                C 362 300 326 318 296 330
                C 276 338 270 352 272 372
                C 274 398 262 420 236 436
                C 228 441 222 434 226 426
                C 236 404 236 384 226 368
                C 216 352 196 346 172 340
                C 132 330 112 298 110 250
                C 108 190 114 138 138 114
                C 148 104 160 99 176 96 Z
                M 300 146
                C 330 142 340 172 326 206
                C 310 244 270 268 214 290
                C 236 240 256 162 300 146 Z
              "
            />
            <circle cx="270" cy="452" r="15" fill="#0A0A0A" />
          </svg>
        </div>
      ) : (
        // Standalone organic mark: deep forest lime in light, vibrant lime in dark
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="80 70 352 410"
          width={size}
          height={size}
          aria-hidden="true"
          className="flex-shrink-0 text-lime-800 dark:text-lime-300 fill-current"
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="
              M 176 96
              C 250 84 340 92 372 124
              C 404 156 400 220 380 262
              C 362 300 326 318 296 330
              C 276 338 270 352 272 372
              C 274 398 262 420 236 436
              C 228 441 222 434 226 426
              C 236 404 236 384 226 368
              C 216 352 196 346 172 340
              C 132 330 112 298 110 250
              C 108 190 114 138 138 114
              C 148 104 160 99 176 96 Z
              M 300 146
              C 330 142 340 172 326 206
              C 310 244 270 268 214 290
              C 236 240 256 162 300 146 Z
            "
          />
          <circle cx="270" cy="452" r="15" fill="currentColor" />
        </svg>
      )}

      {variant === "wordmark" && (
        <span className="font-semibold text-text-primary text-[17px] tracking-tight leading-none">
          Rootwise
        </span>
      )}
    </div>
  );
}
