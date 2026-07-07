import React from 'react';

/**
 * Pre-verified SVG template library for common pattern pieces.
 * Each template is a pure SVG rendered at the given measurements.
 * Dimensions are in "units" (1 unit = 1 inch on paper).
 * The SVG viewBox is auto-calculated from dimensions.
 *
 * Template keys match normalized piece names from the AI.
 */

const GOLD = '#d4af37';
const ACCENT = '#6366f1';
const ROSE = '#f43f5e';

// Shared rendering helpers
const SA_DASH = '6 4';
const GRAIN_DASH = '8 4';

function SvgWrapper({ w, h, children, isPremium }) {
  const pad = 18;
  const vw = w + pad * 2;
  const vh = h + pad * 2;
  const accent = isPremium ? ACCENT : ROSE;
  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ fontFamily: 'monospace' }}
    >
      <rect x="0" y="0" width={vw} height={vh} fill="white" />
      <g transform={`translate(${pad},${pad})`}>
        {children}
        {/* Grain line arrow */}
        <line x1={w / 2} y1={h * 0.2} x2={w / 2} y2={h * 0.8}
          stroke={accent} strokeWidth="1" strokeDasharray={GRAIN_DASH} opacity="0.5" />
        <polygon points={`${w / 2 - 3},${h * 0.22} ${w / 2},${h * 0.18} ${w / 2 + 3},${h * 0.22}`}
          fill={accent} opacity="0.5" />
      </g>
    </svg>
  );
}

// ── BODICE FRONT (fitted) ──────────────────────────────────────────────────
// shoulder narrower than bust, waist suppression, bust dart
function FrontBodice({ bust = 36, waist = 28, shoulderWidth = 14, length = 16, hasDart = true, isPremium }) {
  const accent = isPremium ? ACCENT : ROSE;
  const gold = GOLD;
  // Half pieces
  const hb = bust / 2;
  const hw = waist / 2;
  const hs = shoulderWidth / 2;
  const W = hb + 10; // canvas width
  const H = length + 10;

  // Key points (half-front bodice)
  const neckX = 4, neckY = 0;
  const shoulderX = hs, shoulderY = 0;
  const armholeX = hb * 0.85, armholeY = length * 0.3;
  const sideTopX = hb, sideTopY = length * 0.35;
  const sideWaistX = hw, sideWaistY = length;
  const cfWaistX = 0, cfWaistY = length;
  const cfNeckX = 0, cfNeckY = neckY + 1.5;

  const outline = [
    [neckX, neckY],
    [shoulderX, shoulderY],
    [armholeX, armholeY],
    [sideTopX, sideTopY],
    [sideWaistX, sideWaistY],
    [cfWaistX, cfWaistY],
    [cfNeckX, cfNeckY],
  ];

  const pathD = outline.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x * 3} ${y * 3}`).join(' ') + ' Z';

  // SA path (offset by 3px)
  const saOffset = 3;
  const saD = outline.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x * 3 - saOffset} ${y * 3 - saOffset}`).join(' ') + ' Z';

  // Dart: bust dart on side seam pointing toward bust apex
  const dartBaseY = sideTopY * 3 + 6;
  const dartTipX = hb * 3 * 0.55;
  const dartTipY = length * 3 * 0.28;

  return (
    <SvgWrapper w={W * 3} h={H * 3} isPremium={isPremium}>
      {/* SA dashed border */}
      <path d={saD} fill="none" stroke={gold} strokeWidth="1" strokeDasharray={SA_DASH} opacity="0.7" />
      {/* Main outline */}
      <path d={pathD} fill="rgba(200,200,255,0.06)" stroke={accent} strokeWidth="2" />
      {/* Bust dart */}
      {hasDart && (
        <g>
          <line x1={sideTopX * 3} y1={dartBaseY - 4} x2={dartTipX} y2={dartTipY} stroke={gold} strokeWidth="1.2" />
          <line x1={sideTopX * 3} y1={dartBaseY + 4} x2={dartTipX} y2={dartTipY} stroke={gold} strokeWidth="1.2" />
          <text x={dartTipX + 3} y={dartTipY} fontSize="5" fill={gold}>Bust Dart</text>
        </g>
      )}
      {/* Labels */}
      <text x={hb * 3 * 0.35} y={length * 3 * 0.5} textAnchor="middle" fontSize="6" fontWeight="700" fill={accent}>Front Bodice</text>
      <text x={hb * 3 * 0.35} y={length * 3 * 0.5 + 9} textAnchor="middle" fontSize="5" fill={gold}>Cut × 1 (fold)</text>
      <text x={hb * 3 * 0.35} y={H * 3 - 4} textAnchor="middle" fontSize="4.5" fill="#666">Bust ÷ 2 = {hb}"</text>
    </SvgWrapper>
  );
}

// ── BODICE BACK ──────────────────────────────────────────────────────────────
function BackBodice({ bust = 36, waist = 28, shoulderWidth = 14, length = 16, isPremium }) {
  const accent = isPremium ? ACCENT : ROSE;
  const gold = GOLD;
  const hb = bust / 2;
  const hw = waist / 2;
  const hs = shoulderWidth / 2;
  const W = hb + 10;
  const H = length + 10;

  const outline = [
    [2, 0], [hs, 0], [hb * 0.88, length * 0.32], [hb, length * 0.37],
    [hw, length], [0, length], [0, 1.5]
  ];
  const pathD = outline.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x * 3} ${y * 3}`).join(' ') + ' Z';
  const saD = outline.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x * 3 - 3} ${y * 3 - 3}`).join(' ') + ' Z';

  // Waist dart (back has waist dart)
  const dartX = hb * 3 * 0.45;
  const dartBaseY = length * 3 * 0.85;
  const dartTipY = length * 3 * 0.5;

  return (
    <SvgWrapper w={W * 3} h={H * 3} isPremium={isPremium}>
      <path d={saD} fill="none" stroke={gold} strokeWidth="1" strokeDasharray={SA_DASH} opacity="0.7" />
      <path d={pathD} fill="rgba(200,200,255,0.06)" stroke={accent} strokeWidth="2" />
      {/* Waist dart */}
      <line x1={dartX - 4} y1={dartBaseY} x2={dartX} y2={dartTipY} stroke={gold} strokeWidth="1.2" />
      <line x1={dartX + 4} y1={dartBaseY} x2={dartX} y2={dartTipY} stroke={gold} strokeWidth="1.2" />
      <text x={dartX + 5} y={(dartBaseY + dartTipY) / 2} fontSize="5" fill={gold}>Waist Dart</text>
      <text x={hb * 3 * 0.35} y={length * 3 * 0.45} textAnchor="middle" fontSize="6" fontWeight="700" fill={accent}>Back Bodice</text>
      <text x={hb * 3 * 0.35} y={length * 3 * 0.45 + 9} textAnchor="middle" fontSize="5" fill={gold}>Cut × 1 (fold)</text>
      <text x={hb * 3 * 0.35} y={H * 3 - 4} textAnchor="middle" fontSize="4.5" fill="#666">Waist ÷ 2 = {hw}"</text>
    </SvgWrapper>
  );
}

// ── LONG SLEEVE (tapers toward wrist) ──────────────────────────────────────
function LongSleeve({ bust = 36, sleeveLength = 24, isPremium }) {
  const accent = isPremium ? ACCENT : ROSE;
  const gold = GOLD;
  const armhole = bust * 0.35; // approximate armhole circumference / 2
  const wrist = bust * 0.15;
  const W = armhole + 8;
  const H = sleeveLength + 8;

  // Sleeve head is curved (bell shape at top)
  // Taper from armhole width to wrist width
  const topCenter = [W / 2, 0];
  const topLeft = [2, sleeveLength * 0.2];
  const topRight = [W - 2, sleeveLength * 0.2];
  const wristLeft = [(W - wrist) / 2, sleeveLength];
  const wristRight = [(W + wrist) / 2, sleeveLength];

  const scale = 3;
  const pathD = `
    M ${topCenter[0] * scale} ${topCenter[1] * scale}
    Q ${topRight[0] * scale} ${(topCenter[1]) * scale} ${topRight[0] * scale} ${topRight[1] * scale}
    L ${wristRight[0] * scale} ${wristRight[1] * scale}
    L ${wristLeft[0] * scale} ${wristLeft[1] * scale}
    L ${topLeft[0] * scale} ${topLeft[1] * scale}
    Q ${topLeft[0] * scale} ${topCenter[1] * scale} ${topCenter[0] * scale} ${topCenter[1] * scale}
    Z
  `;

  const midX = W * scale / 2;

  return (
    <SvgWrapper w={W * scale} h={H * scale} isPremium={isPremium}>
      {/* SA */}
      <rect x="3" y="3" width={W * scale - 6} height={H * scale - 6} rx="2"
        fill="none" stroke={gold} strokeWidth="1" strokeDasharray={SA_DASH} opacity="0.6" />
      <path d={pathD} fill="rgba(200,200,255,0.06)" stroke={accent} strokeWidth="2" />
      {/* Straight wrist hem line */}
      <line x1={wristLeft[0] * scale} y1={wristLeft[1] * scale}
        x2={wristRight[0] * scale} y2={wristRight[1] * scale}
        stroke={gold} strokeWidth="2" strokeDasharray="0" />
      <text x={midX} y={sleeveLength * scale * 0.5} textAnchor="middle" fontSize="6" fontWeight="700" fill={accent}>Long Sleeve</text>
      <text x={midX} y={sleeveLength * scale * 0.5 + 9} textAnchor="middle" fontSize="5" fill={gold}>Cut × 2</text>
      <text x={midX} y={H * scale - 4} textAnchor="middle" fontSize="4.5" fill="#666">Length = {sleeveLength}"</text>
    </SvgWrapper>
  );
}

// ── SHORT SLEEVE (straight hem) ───────────────────────────────────────────
function ShortSleeve({ bust = 36, sleeveLength = 8, isPremium }) {
  const accent = isPremium ? ACCENT : ROSE;
  const gold = GOLD;
  const width = bust * 0.35;
  const W = width + 8;
  const H = sleeveLength + 8;
  const scale = 4;

  const pathD = `
    M ${W * scale / 2} 0
    Q ${W * scale - 4} 0 ${W * scale - 4} ${sleeveLength * scale * 0.25}
    L ${W * scale - 4} ${sleeveLength * scale}
    L 4 ${sleeveLength * scale}
    L 4 ${sleeveLength * scale * 0.25}
    Q 4 0 ${W * scale / 2} 0 Z
  `;

  return (
    <SvgWrapper w={W * scale} h={H * scale} isPremium={isPremium}>
      <rect x="3" y="3" width={W * scale - 6} height={H * scale - 6} rx="2"
        fill="none" stroke={gold} strokeWidth="1" strokeDasharray={SA_DASH} opacity="0.6" />
      <path d={pathD} fill="rgba(200,200,255,0.06)" stroke={accent} strokeWidth="2" />
      {/* STRAIGHT hem — critical for short sleeve */}
      <line x1="4" y1={H * scale - 4} x2={W * scale - 4} y2={H * scale - 4}
        stroke={gold} strokeWidth="2.5" />
      <text x={(W * scale) / 2} y={(H * scale) * 0.48} textAnchor="middle" fontSize="6" fontWeight="700" fill={accent}>Short Sleeve</text>
      <text x={(W * scale) / 2} y={(H * scale) * 0.48 + 9} textAnchor="middle" fontSize="5" fill={gold}>Cut × 2 · Straight Hem</text>
    </SvgWrapper>
  );
}

// ── SKIRT PANEL ────────────────────────────────────────────────────────────
function SkirtPanel({ hips = 38, skirtLength = 24, flare = 1.1, isPremium }) {
  const accent = isPremium ? ACCENT : ROSE;
  const gold = GOLD;
  const topW = hips / 2;
  const bottomW = topW * flare;
  const W = bottomW + 8;
  const H = skirtLength + 8;
  const scale = 2.5;

  const topLeft = [(W - topW) / 2, 0];
  const topRight = [(W + topW) / 2, 0];
  const botLeft = [(W - bottomW) / 2, skirtLength];
  const botRight = [(W + bottomW) / 2, skirtLength];

  return (
    <SvgWrapper w={W * scale} h={H * scale} isPremium={isPremium}>
      {/* SA */}
      <rect x="3" y="3" width={W * scale - 6} height={H * scale - 6}
        fill="none" stroke={gold} strokeWidth="1" strokeDasharray={SA_DASH} opacity="0.6" />
      <polygon
        points={`${topLeft[0] * scale},${topLeft[1] * scale} ${topRight[0] * scale},${topRight[1] * scale} ${botRight[0] * scale},${botRight[1] * scale} ${botLeft[0] * scale},${botLeft[1] * scale}`}
        fill="rgba(200,200,255,0.06)" stroke={accent} strokeWidth="2" />
      <text x={W * scale / 2} y={skirtLength * scale * 0.5} textAnchor="middle" fontSize="6" fontWeight="700" fill={accent}>Skirt Panel</text>
      <text x={W * scale / 2} y={skirtLength * scale * 0.5 + 9} textAnchor="middle" fontSize="5" fill={gold}>Hips ÷ 2 = {topW}"</text>
      <text x={W * scale / 2} y={H * scale - 4} textAnchor="middle" fontSize="4.5" fill="#666">Length = {skirtLength}"</text>
    </SvgWrapper>
  );
}

// ── COLLAR LEAF (under-collar) ─────────────────────────────────────────────
function CollarLeaf({ neckCirc = 14, collarWidth = 2.5, isPremium }) {
  const accent = isPremium ? ACCENT : ROSE;
  const gold = GOLD;
  const W = neckCirc + 4;
  const H = collarWidth * 3 + 4;
  const scale = 5;

  return (
    <SvgWrapper w={W * scale} h={H * scale} isPremium={isPremium}>
      {/* Curved collar shape — unrolled flat "leaf" */}
      <path
        d={`M 4 ${H * scale / 2} Q ${W * scale / 2} ${4} ${W * scale - 4} ${H * scale / 2} Q ${W * scale / 2} ${H * scale - 4} 4 ${H * scale / 2} Z`}
        fill="rgba(200,200,255,0.06)" stroke={accent} strokeWidth="2" />
      {/* SA */}
      <path
        d={`M 7 ${H * scale / 2} Q ${W * scale / 2} ${7} ${W * scale - 7} ${H * scale / 2} Q ${W * scale / 2} ${H * scale - 7} 7 ${H * scale / 2} Z`}
        fill="none" stroke={gold} strokeWidth="1" strokeDasharray={SA_DASH} opacity="0.7" />
      <text x={W * scale / 2} y={H * scale / 2 - 4} textAnchor="middle" fontSize="6" fontWeight="700" fill={accent}>Collar Leaf</text>
      <text x={W * scale / 2} y={H * scale / 2 + 8} textAnchor="middle" fontSize="5" fill={gold}>Unrolled flat · Cut × 2</text>
      <text x={W * scale / 2} y={H * scale / 2 + 17} textAnchor="middle" fontSize="4.5" fill="#666">Neck = {neckCirc}"</text>
    </SvgWrapper>
  );
}

// ── COLLAR STAND ─────────────────────────────────────────────────────────────
function CollarStand({ neckCirc = 14, standHeight = 1.5, isPremium }) {
  const accent = isPremium ? ACCENT : ROSE;
  const gold = GOLD;
  const W = neckCirc + 4;
  const H = standHeight + 2;
  const scale = 6;

  return (
    <SvgWrapper w={W * scale} h={H * scale} isPremium={isPremium}>
      <rect x="4" y="4" width={W * scale - 8} height={H * scale - 8} rx="4"
        fill="rgba(200,200,255,0.06)" stroke={accent} strokeWidth="2" />
      <rect x="7" y="7" width={W * scale - 14} height={H * scale - 14} rx="3"
        fill="none" stroke={gold} strokeWidth="1" strokeDasharray={SA_DASH} opacity="0.7" />
      <text x={W * scale / 2} y={H * scale / 2 - 2} textAnchor="middle" fontSize="6" fontWeight="700" fill={accent}>Collar Stand</text>
      <text x={W * scale / 2} y={H * scale / 2 + 8} textAnchor="middle" fontSize="4.5" fill={gold}>Height {standHeight}" · Cut × 2</text>
    </SvgWrapper>
  );
}

// ── TROUSER FRONT (shorter rise) ──────────────────────────────────────────
function TrouserFront({ waist = 28, hips = 38, thigh = 22, trouserLength = 40, isPremium }) {
  const accent = isPremium ? ACCENT : ROSE;
  const gold = GOLD;
  const hw = waist / 4;
  const hh = hips / 4;
  const ht = thigh / 4;
  const W = Math.max(hw, hh, ht) + 8;
  const H = trouserLength + 8;
  const scale = 2;

  // Front rise shorter and less curved than back
  const waistY = 0;
  const crotchY = trouserLength * 0.28;
  const kneeY = trouserLength * 0.6;
  const hemY = trouserLength;

  const points = [
    [W / 2 - hw, waistY],
    [W / 2 + hw, waistY],
    [W / 2 + hh, crotchY * 0.5],
    [W / 2 + ht, kneeY],
    [W / 2 + ht * 0.9, hemY],
    [W / 2 - ht * 0.9, hemY],
    [W / 2 - ht, kneeY],
    [W / 2 - hh, crotchY * 0.5],
  ];

  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x * scale} ${y * scale}`).join(' ');
  // Front rise: shorter curve
  const riseD = `Q ${(W / 2 + hh) * scale} ${crotchY * scale * 0.8} ${(W / 2 + hh * 0.2) * scale} ${crotchY * scale}`;

  return (
    <SvgWrapper w={W * scale} h={H * scale} isPremium={isPremium}>
      <rect x="3" y="3" width={W * scale - 6} height={H * scale - 6}
        fill="none" stroke={gold} strokeWidth="1" strokeDasharray={SA_DASH} opacity="0.5" />
      <path d={pathD + ' ' + riseD + ' Z'} fill="rgba(200,200,255,0.06)" stroke={accent} strokeWidth="1.8" />
      {/* Rise label */}
      <text x={(W / 2 + hh) * scale + 4} y={crotchY * scale * 0.5} fontSize="5" fill={gold}>Front Rise</text>
      <text x={W * scale / 2} y={trouserLength * scale * 0.45} textAnchor="middle" fontSize="6" fontWeight="700" fill={accent}>Trouser Front</text>
      <text x={W * scale / 2} y={trouserLength * scale * 0.45 + 9} textAnchor="middle" fontSize="5" fill={gold}>Cut × 2</text>
    </SvgWrapper>
  );
}

// ── TROUSER BACK (deeper back rise) ──────────────────────────────────────
function TrouserBack({ waist = 28, hips = 38, thigh = 22, trouserLength = 40, isPremium }) {
  const accent = isPremium ? ACCENT : ROSE;
  const gold = GOLD;
  const hw = (waist / 4) + 1; // back slightly wider at waist
  const hh = (hips / 4) + 1.5; // wider seat
  const ht = thigh / 4;
  const W = Math.max(hw, hh, ht) + 10;
  const H = trouserLength + 10;
  const scale = 2;

  const waistY = 0;
  const crotchY = trouserLength * 0.32; // deeper than front
  const kneeY = trouserLength * 0.6;
  const hemY = trouserLength;

  const points = [
    [W / 2 - hw, waistY + 1], // back waist slightly higher at side
    [W / 2 + hw, waistY],
    [W / 2 + hh, crotchY * 0.4],
  ];

  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x * scale} ${y * scale}`).join(' ');
  // Back rise: deeper, longer curve for seat
  const riseD = `Q ${(W / 2 + hh + 2) * scale} ${crotchY * scale * 0.9} ${(W / 2 - hh * 0.3) * scale} ${crotchY * scale}`;
  const legD = `L ${(W / 2 - ht) * scale} ${kneeY * scale} L ${(W / 2 - ht * 0.9) * scale} ${hemY * scale} L ${(W / 2 + ht * 0.9) * scale} ${hemY * scale} L ${(W / 2 + ht) * scale} ${kneeY * scale} L ${(W / 2 + hh) * scale} ${crotchY * 0.4 * scale}`;

  return (
    <SvgWrapper w={W * scale} h={H * scale} isPremium={isPremium}>
      <rect x="3" y="3" width={W * scale - 6} height={H * scale - 6}
        fill="none" stroke={gold} strokeWidth="1" strokeDasharray={SA_DASH} opacity="0.5" />
      <path d={pathD + ' ' + riseD + legD + ' Z'} fill="rgba(200,200,255,0.06)" stroke={accent} strokeWidth="1.8" />
      <text x={(W / 2 + hh + 2) * scale + 3} y={crotchY * scale * 0.7} fontSize="5" fill={gold}>Back Rise</text>
      <text x={W * scale / 2} y={trouserLength * scale * 0.45} textAnchor="middle" fontSize="6" fontWeight="700" fill={accent}>Trouser Back</text>
      <text x={W * scale / 2} y={trouserLength * scale * 0.45 + 9} textAnchor="middle" fontSize="5" fill={gold}>Deeper Seat Curve · Cut × 2</text>
    </SvgWrapper>
  );
}

// ── LOOSE BODY PANEL (kaftan/dashiki) ──────────────────────────────────────
function LooseBodyPanel({ width = 24, length = 50, isPremium }) {
  const accent = isPremium ? ACCENT : ROSE;
  const gold = GOLD;
  const scale = 2;

  return (
    <SvgWrapper w={width * scale} h={length * scale} isPremium={isPremium}>
      <rect x="4" y="4" width={width * scale - 8} height={length * scale - 8}
        fill="rgba(200,200,255,0.06)" stroke={accent} strokeWidth="2" />
      <rect x="8" y="8" width={width * scale - 16} height={length * scale - 16}
        fill="none" stroke={gold} strokeWidth="1" strokeDasharray={SA_DASH} opacity="0.7" />
      <text x={width * scale / 2} y={length * scale * 0.45} textAnchor="middle" fontSize="6" fontWeight="700" fill={accent}>Body Panel</text>
      <text x={width * scale / 2} y={length * scale * 0.45 + 9} textAnchor="middle" fontSize="5" fill={gold}>Flat cut · No shaping</text>
      <text x={width * scale / 2} y={length * scale - 8} textAnchor="middle" fontSize="4.5" fill="#666">{width}" × {length}"</text>
    </SvgWrapper>
  );
}

// ── CORSET PANEL ────────────────────────────────────────────────────────────
function CorsetPanel({ bust = 36, waist = 26, length = 14, panelNum = 1, totalPanels = 6, isPremium }) {
  const accent = isPremium ? ACCENT : ROSE;
  const gold = GOLD;
  const topW = (bust / totalPanels) + 0.5;
  const botW = (waist / totalPanels) - 0.3;
  const W = topW + 4;
  const H = length + 4;
  const scale = 5;

  const tl = [(W - topW) / 2, 0];
  const tr = [(W + topW) / 2, 0];
  const bl = [(W - botW) / 2, length];
  const br = [(W + botW) / 2, length];

  return (
    <SvgWrapper w={W * scale} h={H * scale} isPremium={isPremium}>
      {/* Boning channel lines */}
      <line x1={W * scale / 2} y1="6" x2={W * scale / 2} y2={H * scale - 6}
        stroke={gold} strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      {/* SA */}
      <polygon
        points={`${(tl[0] - 0.4) * scale},${tl[1] * scale - 3} ${(tr[0] + 0.4) * scale},${tr[1] * scale - 3} ${(br[0] + 0.4) * scale},${br[1] * scale + 3} ${(bl[0] - 0.4) * scale},${bl[1] * scale + 3}`}
        fill="none" stroke={gold} strokeWidth="1" strokeDasharray={SA_DASH} opacity="0.7" />
      {/* Main shape */}
      <polygon
        points={`${tl[0] * scale},${tl[1] * scale} ${tr[0] * scale},${tr[1] * scale} ${br[0] * scale},${br[1] * scale} ${bl[0] * scale},${bl[1] * scale}`}
        fill="rgba(200,200,255,0.06)" stroke={accent} strokeWidth="2" />
      <text x={W * scale / 2} y={H * scale * 0.42} textAnchor="middle" fontSize="5.5" fontWeight="700" fill={accent}>Panel {panelNum}</text>
      <text x={W * scale / 2} y={H * scale * 0.42 + 8} textAnchor="middle" fontSize="4.5" fill={gold}>Boning Channel ↕</text>
    </SvgWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE RESOLVER
// Maps a piece name (normalized) → the correct SVG template component
// ══════════════════════════════════════════════════════════════════════════════

function normalizeName(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

export function resolveTemplate(pieceName, measurements = {}, isPremium = false) {
  const n = normalizeName(pieceName);
  const {
    bust = 36, waist = 28, hips = 38,
    shoulder: shoulderWidth = 14,
    gownLength = 16, sleeveLength = 24,
    trouserLength = 40, thigh = 22
  } = measurements;

  // Bodice front
  if (n.includes('front bodice') || n.includes('bodice front') || (n.includes('front') && n.includes('bodice')))
    return <FrontBodice bust={+bust} waist={+waist} shoulderWidth={+shoulderWidth} length={+gownLength * 0.45} isPremium={isPremium} />;

  // Bodice back
  if (n.includes('back bodice') || n.includes('bodice back') || (n.includes('back') && n.includes('bodice')))
    return <BackBodice bust={+bust} waist={+waist} shoulderWidth={+shoulderWidth} length={+gownLength * 0.45} isPremium={isPremium} />;

  // Long sleeve
  if ((n.includes('sleeve') || n.includes('arm')) && (n.includes('long') || (+sleeveLength > 15)))
    return <LongSleeve bust={+bust} sleeveLength={+sleeveLength || 24} isPremium={isPremium} />;

  // Short sleeve
  if (n.includes('short') && n.includes('sleeve'))
    return <ShortSleeve bust={+bust} sleeveLength={+sleeveLength || 8} isPremium={isPremium} />;

  // Sleeve (default to long)
  if (n.includes('sleeve'))
    return <LongSleeve bust={+bust} sleeveLength={+sleeveLength || 24} isPremium={isPremium} />;

  // Skirt
  if (n.includes('skirt') || n.includes('flare') || n.includes('a-line'))
    return <SkirtPanel hips={+hips} skirtLength={+(gownLength * 0.6)} flare={n.includes('flare') ? 1.4 : 1.1} isPremium={isPremium} />;

  // Collar leaf/under-collar
  if (n.includes('collar') && (n.includes('leaf') || n.includes('under') || n.includes('top')))
    return <CollarLeaf neckCirc={+bust * 0.39} collarWidth={2.5} isPremium={isPremium} />;

  // Collar stand
  if (n.includes('collar') && n.includes('stand'))
    return <CollarStand neckCirc={+bust * 0.39} isPremium={isPremium} />;

  // Collar (generic)
  if (n.includes('collar') || n.includes('neckband') || n.includes('mandarin'))
    return <CollarLeaf neckCirc={+bust * 0.39} collarWidth={2.5} isPremium={isPremium} />;

  // Trouser front
  if ((n.includes('trouser') || n.includes('pant') || n.includes('trousers')) && n.includes('front'))
    return <TrouserFront waist={+waist} hips={+hips} thigh={+thigh} trouserLength={+trouserLength} isPremium={isPremium} />;

  // Trouser back
  if ((n.includes('trouser') || n.includes('pant') || n.includes('trousers')) && n.includes('back'))
    return <TrouserBack waist={+waist} hips={+hips} thigh={+thigh} trouserLength={+trouserLength} isPremium={isPremium} />;

  // Corset panel
  if (n.includes('panel') && (n.includes('corset') || n.includes('boning')))
    return <CorsetPanel bust={+bust} waist={+waist} isPremium={isPremium} />;

  // Loose body panel (kaftan, dashiki, agbada)
  if (n.includes('body') || n.includes('kaftan') || n.includes('dashiki') || n.includes('agbada') || n.includes('boubou') || n.includes('loose'))
    return <LooseBodyPanel width={+bust * 0.55} length={+gownLength || 50} isPremium={isPremium} />;

  // Generic fallback panel
  return <LooseBodyPanel width={+bust * 0.5 || 18} length={+gownLength * 0.6 || 20} isPremium={isPremium} />;
}

export {
  FrontBodice, BackBodice, LongSleeve, ShortSleeve,
  SkirtPanel, CollarLeaf, CollarStand,
  TrouserFront, TrouserBack, CorsetPanel, LooseBodyPanel
};