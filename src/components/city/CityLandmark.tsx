import type { ReactNode } from "react";
import type { CityLandmark as Landmark } from "@/lib/cities";
import { cn } from "@/lib/utils";

// Monoline line-art drawn on a shared 400×400 canvas (ground at y≈370).
// Strokes use currentColor so they follow the theme; `context` marks the
// faint background detail and `accent` the one highlighted element.
const context = "opacity-35";
const accent = "text-accent";

const DRAWINGS: Record<Landmark, ReactNode> = {
  "cn-tower": (
    <>
      <g className={context}>
        <path d="M240 370 Q275 332 310 370" />
        <path d="M60 370 V330 H84 V370 M92 370 V312 H112 V370 M318 370 V340 H340 V370" />
      </g>
      <path d="M182 370 L193 160 M218 370 L207 160 M200 370 V160" />
      <path d="M168 146 Q200 126 232 146" />
      <ellipse cx="200" cy="150" rx="36" ry="7" />
      <path d="M166 153 Q200 180 234 153" />
      <path d="M196 132 L197 92 M204 132 L203 92" />
      <ellipse cx="200" cy="86" rx="11" ry="6" />
      <path d="M200 80 V22 M197 62 H203 M197 46 H203" />
      <circle cx="200" cy="18" r="2.5" className={cn(accent, "fill-current")} />
      <path d="M30 370 H370" />
    </>
  ),
  "calgary-tower": (
    <>
      <g className={context}>
        <path d="M30 370 L80 318 L108 342 L146 300 L176 336" />
        <path d="M232 340 L262 306 L296 334 L330 296 L370 340" />
        <path d="M236 370 L240 348 Q275 332 310 348 L314 370" />
      </g>
      <path d="M188 370 L192 120 M212 370 L208 120" />
      <path d="M180 120 H220 L232 92 H168 Z" />
      <path d="M172 104 H228" />
      <path d="M172 92 L176 84 H224 L228 92" />
      <path d="M200 84 V62" />
      <path d="M200 62 C193 53 197 45 200 38 C203 45 207 53 200 62 Z" className={accent} />
      <path d="M30 370 H370" />
    </>
  ),
  "olympic-stadium": (
    <>
      <path d="M50 370 C52 336 120 324 200 322 C280 324 330 334 336 370" />
      <path d="M78 370 C84 348 140 340 200 339 C258 340 300 348 308 370" className={context} />
      <path d="M312 370 C292 282 254 192 220 120 M286 370 C268 288 234 202 202 130" />
      <path d="M198 132 L224 116 L218 106 L196 120 Z" />
      <path d="M238 172 L108 331 M252 206 L140 328 M264 240 L172 325" className={context} />
      <circle cx="210" cy="113" r="2.5" className={cn(accent, "fill-current")} />
      <path d="M30 370 H370" />
    </>
  ),
  "tower-bridge": (
    <>
      {/* Towers */}
      <path d="M110 330 V160 H150 V330 M250 330 V160 H290 V330" />
      <path d="M108 160 L130 118 L152 160 M248 160 L270 118 L292 160" />
      <path d="M110 160 V140 M106 145 L110 130 L114 145 M150 160 V140 M146 145 L150 130 L154 145" />
      <path d="M250 160 V140 M246 145 L250 130 L254 145 M290 160 V140 M286 145 L290 130 L294 145" />
      <path d="M130 118 V108 M270 118 V108" />
      <circle cx="130" cy="106" r="2.5" className={cn(accent, "fill-current")} />
      <circle cx="270" cy="106" r="2.5" className={cn(accent, "fill-current")} />
      <path d="M118 330 V252 Q130 232 142 252 V330 M258 330 V252 Q270 232 282 252 V330" />
      <path d="M124 178 H136 V198 H124 Z M264 178 H276 V198 H264 Z" />
      {/* High-level walkways */}
      <path d="M150 180 H250 M150 194 H250" />
      <path d="M160 180 L170 194 M180 180 L190 194 M200 180 L210 194 M220 180 L230 194" className={context} />
      {/* Deck */}
      <path d="M20 290 H110 M150 290 H250 M290 290 H380" />
      {/* Suspension chains and hangers */}
      <path d="M110 175 Q70 240 20 285 V330 M290 175 Q330 240 380 285 V330" />
      <path d="M89 206 V290 M67 235 V290 M44 261 V290 M311 206 V290 M333 235 V290 M356 261 V290" className={context} />
      {/* Water */}
      <path d="M20 330 H380" />
      <path d="M50 348 Q65 343 80 348 M140 356 Q160 350 180 356 M230 348 Q248 343 266 348 M310 358 Q326 352 342 358" className={context} />
    </>
  ),
  "willis-tower": (
    <>
      <g className={context}>
        <path d="M50 370 V250 H90 V370 M96 370 V290 H126 V370" />
        <path d="M276 370 V230 H306 V370 M312 370 V280 H350 V370" />
      </g>
      <path d="M140 370 V210 H160 V110 H180 V60 H230 V90 H245 V160 H260 V370" />
      <path d="M160 210 V370 M180 110 V370 M230 90 V370 M245 160 V370" />
      <path d="M140 280 H260 M160 200 H245 M180 120 H230" className={context} />
      <path d="M190 60 V12 M220 60 V24" />
      <circle cx="190" cy="10" r="2.5" className={cn(accent, "fill-current")} />
      <path d="M30 370 H370" />
    </>
  ),
  "statue-of-liberty": (
    <>
      {/* Pedestal */}
      <path d="M150 370 V330 H250 V370 M160 330 L165 280 H235 L240 330" />
      <path d="M158 280 H242 M162 274 H238 M170 274 L175 262 H225 L230 274" />
      {/* Figure */}
      <path d="M180 262 C178 220 182 190 186 160 M220 262 C222 225 218 195 214 160" />
      <path d="M186 160 C190 150 210 150 214 160" />
      <circle cx="200" cy="138" r="9" />
      <path d="M193 131 L184 118 M197 129 L193 114 M201 129 V112 M205 129 L209 114 M208 131 L217 118" />
      <path d="M195 172 C193 210 192 240 190 262 M205 176 C206 210 208 240 210 262" className={context} />
      {/* Raised arm and torch */}
      <path d="M188 156 L176 100 M196 152 L184 98" />
      <path d="M176 98 L178 80 M184 98 L182 80" />
      <path d="M168 80 H190 L185 72 H173 Z" />
      <path d="M179 72 C171 62 176 54 179 46 C182 54 187 62 179 72 Z" className={accent} />
      {/* Tablet */}
      <path d="M214 175 L230 168 L236 210 L220 216 Z" />
      {/* Water */}
      <path d="M30 370 H370" />
      <path d="M60 386 Q80 380 100 386 M300 386 Q320 380 340 386" className={context} />
    </>
  ),
};

export function CityLandmark({
  landmark,
  label,
  className,
}: {
  landmark: Landmark;
  label: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label={label}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {DRAWINGS[landmark]}
    </svg>
  );
}
