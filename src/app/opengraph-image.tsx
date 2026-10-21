import { ImageResponse } from "next/og";

// Site-wide social preview (Open Graph + X). Child routes inherit it unless
// they set their own images — listing pages use their cover photo when present.
export const alt = "GPUDealer — Find. Sell. Request. Used GPUs, AI servers, memory and compute hardware.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0b0b0e";
const PAPER = "#f8f6f2";
const MUTED = "#8b8b94";
const ACCENT = "#e5323b";

// Blades of one fan, as SVG paths around (cx, cy).
function fanBlades(cx: number, cy: number, radius: number, count = 9) {
  const point = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  const hub = radius * 0.3;
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return `M${point(hub, a)} Q${point(radius * 0.7, a + 0.15)} ${point(radius * 0.94, a + 0.45)} L${point(radius * 0.94, a + 0.62)} Q${point(radius * 0.6, a + 0.36)} ${point(hub, a + 0.32)} Z`;
  });
}

function GpuIllustration() {
  const fans = [150, 300, 450];
  return (
    <svg width="480" height="257" viewBox="0 0 560 300">
      {/* PCIe bracket */}
      <rect x="0" y="22" width="26" height="236" rx="3" fill="#3a3a42" />
      {[60, 90, 120, 150, 180].map((y) => (
        <rect key={y} x="8" y={y} width="10" height="20" rx="2" fill="#1c1c22" />
      ))}
      {/* Card body + shroud */}
      <rect x="26" y="30" width="520" height="220" rx="18" fill="#16161b" stroke="#2c2c34" strokeWidth="2" />
      <rect x="26" y="30" width="520" height="8" rx="4" fill={ACCENT} />
      {/* Power connector */}
      <rect x="470" y="16" width="56" height="16" rx="3" fill="#2c2c34" />
      {/* Fans */}
      {fans.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="144" r="68" fill="#0e0e12" stroke="#2c2c34" strokeWidth="3" />
          {fanBlades(cx, 144, 62).map((d, i) => (
            <path key={i} d={d} fill="#2a2a31" />
          ))}
          <circle cx={cx} cy="144" r="19" fill="#202027" stroke="#34343c" strokeWidth="2" />
          <circle cx={cx} cy="144" r="5" fill={ACCENT} />
        </g>
      ))}
      {/* PCIe gold fingers */}
      <rect x="90" y="250" width="300" height="20" rx="2" fill="#1c1c22" />
      {Array.from({ length: 28 }, (_, i) => (
        <rect key={i} x={96 + i * 10.4} y="253" width="6" height="15" fill="#b8954a" />
      ))}
    </svg>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: INK,
          backgroundImage: "radial-gradient(circle at 82% 50%, rgba(229, 50, 59, 0.16), transparent 45%)",
          color: PAPER,
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
            <div style={{ width: 18, height: 18, background: ACCENT, borderRadius: 4 }} />
            GPUDealer
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 700, lineHeight: 1.0, letterSpacing: -3 }}>
              <span>Find.</span>
              <span>Sell.</span>
              <span style={{ color: ACCENT }}>Request.</span>
            </div>
            <div style={{ marginTop: 28, fontSize: 28, lineHeight: 1.35, color: MUTED }}>
              Used GPUs, AI servers, memory and compute hardware.
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: MUTED }}>
            gpudealer.com
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
          <GpuIllustration />
        </div>
      </div>
    ),
    size,
  );
}
