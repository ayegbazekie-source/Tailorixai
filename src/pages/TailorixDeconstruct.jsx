import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { usePremium } from '@/components/PremiumProvider';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Upload, Scissors, Lock, Crown, ChevronDown, ChevronUp,
  Loader2, Sparkles, Ruler, FileText, Wand2, CheckCircle2,
  ZoomIn, X, ArrowRight, RotateCcw, AlertCircle, Download, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import CreditCapsule from '@/components/deconstruct/CreditCapsule';
import { useCreditSystem } from '@/components/useCreditSystem';
import FeedShareModal from '@/components/deconstruct/FeedShareModal';
import RateReviewModal from '@/components/RateReviewModal';
import AILoadingNotice from '@/components/AILoadingNotice';
import AdWatchModal from '@/components/AdWatchModal';
import UpgradeModal from '@/components/UpgradeModal';
import { useRandomReviewPrompt } from '@/hooks/useRandomReviewPrompt';

// ─── Step Badge ───────────────────────────────────────────────────────────────
function StepBadge({ num, label, active, done, isPremium }) {
  const activeColor = isPremium ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white';
  const doneColor = isPremium ? 'bg-yellow-500 text-slate-900' : 'bg-emerald-500 text-white';
  const idleColor = isPremium
    ? 'bg-slate-800 text-slate-500 border border-slate-700'
    : 'bg-slate-100 text-slate-400 border border-slate-200';
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${done ? doneColor : active ? activeColor : idleColor}`}>
      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-4 h-4 flex items-center justify-center">{num}</span>}
      {label}
    </div>
  );
}

// ─── Zoom Modal ───────────────────────────────────────────────────────────────
function ZoomModal({ src, label, onClose }) {
  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white flex items-center gap-2 text-sm">
          <X className="w-5 h-5" /> Close
        </button>
        {label && <p className="text-white/60 text-xs text-center mb-2 uppercase tracking-widest">{label}</p>}
        <img src={src} alt={label} className="w-full max-h-[85vh] object-contain rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Zoomable Image Card ──────────────────────────────────────────────────────
function ZoomableImage({ src, label, isPremium, className = '' }) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <>
      {zoomed && <ZoomModal src={src} label={label} onClose={() => setZoomed(false)} />}
      <div
        className={`relative group cursor-zoom-in rounded-2xl overflow-hidden ${className}`}
        onClick={() => setZoomed(true)}
      >
        <img src={src} alt={label} className="w-full object-contain" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
            <ZoomIn className="w-5 h-5 text-white" />
          </div>
        </div>
        {label && (
          <div className={`absolute bottom-0 left-0 right-0 px-3 py-2 text-xs font-bold uppercase tracking-widest text-center ${isPremium ? 'bg-indigo-900/80 text-indigo-200' : 'bg-slate-900/70 text-white'}`}>
            {label}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Analysis Tag ─────────────────────────────────────────────────────────────
function Tag({ children, isPremium }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${isPremium
      ? 'bg-indigo-900/50 border-indigo-500/30 text-indigo-200'
      : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
      {children}
    </span>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, sub, isPremium }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-indigo-900/60' : 'bg-rose-50'}`}>
        {icon}
      </div>
      <div>
        <h3 className={`font-bold text-base ${isPremium ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        {sub && <p className={`text-xs ${isPremium ? 'text-indigo-300/70' : 'text-slate-500'}`}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TailorixDeconstruct() {
  const { user: currentUser, isPremiumActive } = usePremium();
  const { credits, dailyAdsWatched, loading: creditsLoading, hasCredits, showGoPremium, handleAdReward, deductCredit } = useCreditSystem('illustrator');
  const isPro = isPremiumActive;

  // System theme detection for free users
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  useEffect(() => {
    if (isPro) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [isPro]);

  // For free users: follow system. For premium: always Midnight Indigo (dark)
  const isDark = isPro ? true : systemDark;

  const autoStartedRef = React.useRef(false);

  const [step, setStep] = useState(1);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [userFeedback, setUserFeedback] = useState('');
  const [illustrationLoading, setIllustrationLoading] = useState(false);
  const [illustrationUrl, setIllustrationUrl] = useState(null);
  const [patternLoading, setPatternLoading] = useState(false);
  const [patternUrl, setPatternUrl] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [showFeedShare, setShowFeedShare] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { reviewTrigger, triggerReview, resetReviewTrigger } = useRandomReviewPrompt();

  const fileInputRef = useRef();

  // ── Auto-start for Tailors redirected from workspace ──
  useEffect(() => {
    if (autoStartedRef.current) return;
    const urlParams = new URLSearchParams(window.location.search);
    const autoImageUrl = urlParams.get('auto_image_url') || urlParams.get('workspace_image_url');
    if (!autoImageUrl) return;
    autoStartedRef.current = true;
    // Set the image from URL and auto-trigger analysis
    setImagePreview(autoImageUrl);
    setUploadedFileUrl(autoImageUrl);
    setUploadedImage({ _auto: true }); // non-null sentinel
    // Fetch the image as a File and then call analyze
    (async () => {
      try {
        const resp = await fetch(autoImageUrl);
        const blob = await resp.blob();
        const file = new File([blob], 'workspace-design.png', { type: blob.type });
        setUploadedImage(file);
        setAnalysisLoading(true);
        try {
          const ANALYSIS_PROMPT = `[TAILORIX AI — MASTER GARMENT ENGINEERING SYSTEM v3] You are a Chief Pattern Engineer. Analyze this garment image with master-tailor precision. Classify using the precise formula: [Silhouette] + [Neckline] + [Sleeve] + [Length] + [Key Detail]. Break down ALL pattern pieces with exact cut quantities and grain notes. Identify every structural component, dart type, closure, interfacing zone, and boning requirement. Output a full professional sewing construction sequence of 10-14 steps. Return structured JSON with: garment_type, silhouette, neckline, sleeve_type, structural_components, pattern_pieces (full breakdown with × cut quantities), decorative_elements, fabric_type, interfacing_notes, support_notes, construction_order, validation_notes, technical_notes, analysis_summary, reconstruction_notes, confidence_level.`;
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: ANALYSIS_PROMPT,
            file_urls: [autoImageUrl],
            response_json_schema: {
              type: 'object',
              properties: {
                garment_type: { type: 'string' },
                silhouette: { type: 'string' },
                neckline: { type: 'string' },
                sleeve_type: { type: 'string' },
                structural_components: { type: 'array', items: { type: 'string' } },
                pattern_pieces: { type: 'string' },
                decorative_elements: { type: 'array', items: { type: 'string' } },
                fabric_type: { type: 'string' },
                interfacing_notes: { type: 'string' },
                support_notes: { type: 'string' },
                construction_order: { type: 'array', items: { type: 'string' } },
                validation_notes: { type: 'array', items: { type: 'string' } },
                technical_notes: { type: 'array', items: { type: 'string' } },
                analysis_summary: { type: 'string' },
                reconstruction_notes: { type: 'string' },
                confidence_level: { type: 'string' }
              }
            }
          });
          setAnalysis(result);
          setStep(2);
        } catch (err) { console.error(err); }
        setAnalysisLoading(false);
      } catch (e) { console.error('Auto-load failed', e); }
    })();
  }, []);

  // ── Theme ──
  // Premium: Midnight Indigo (hardcoded dark)
  // Free Dark: slate dark
  // Free Light: clean white/gray
  const pageBg = isPro
    ? 'bg-gradient-to-br from-[#0a0a1a] via-[#0f0f28] to-[#0a0a1a] min-h-screen'
    : isDark
    ? 'bg-slate-900 min-h-screen'
    : 'bg-[#f5f5f7] min-h-screen';

  const cardBg = isPro
    ? 'bg-[#111127] border border-indigo-500/20 shadow-xl shadow-indigo-950/40'
    : isDark
    ? 'bg-slate-800 border border-slate-700 shadow-md'
    : 'bg-white border border-slate-200 shadow-md';

  const titleColor = isPro ? 'text-white' : isDark ? 'text-white' : 'text-slate-900';
  const subColor = isPro ? 'text-indigo-300/70' : isDark ? 'text-slate-400' : 'text-slate-500';

  const accentBtn = isPro
    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white'
    : 'bg-rose-500 hover:bg-rose-600 text-white';

  const goldBtn = 'bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-slate-900 font-bold';

  // CAD board bg — light gray in Free-Light mode to distinguish from page bg
  const cadBoardBg = isPro
    ? 'bg-indigo-950/30'
    : isDark
    ? 'bg-slate-900'
    : 'bg-[#F0F0F0]';

  // ── Step 1: Upload & Analyze ──────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedImage(file);
    setAnalysis(null);
    setIllustrationUrl(null);
    setPatternUrl(null);
    setStep(1);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedImage) return;
    setAnalysisLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadedImage });
      setUploadedFileUrl(file_url);

      const ANALYSIS_PROMPT = `
[TAILORIX AI — MASTER GARMENT ENGINEERING SYSTEM v3]

You are Tailorix AI's Chief Pattern Engineer — trained in Armstrong Patternmaking (5th ed.), Aldrich Metric Pattern Cutting for Women's Wear, Bray's More Dressmaking with a Difference, and Winifred Aldrich's Metric Pattern Cutting for Men's Wear. You think EXACTLY like a master tailor standing in front of a cutting table, preparing to reverse-engineer this garment for full-scale pattern drafting.

Your output will be used to:
1. Draft physical sewing patterns
2. Generate technical fashion illustrations
3. Produce digitized flat pattern boards

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: GARMENT CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Identify using the PRECISE FORMULA:
[Silhouette Type] + [Neckline Shape] + [Sleeve Classification] + [Length/Level] + [Dominant Construction Feature]

Examples of correct output:
• "Fitted Princess-Seam Sweetheart Strapless Midi Gown with Basque Waist"
• "Boxy Double-Breasted Peak-Lapel Structured Blazer with Patch Pockets"
• "A-Line High-Waist Off-Shoulder Flutter-Sleeve Midi Dress with Smocking"

DO NOT output generic labels like "Evening Dress" or "Casual Top".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: STRUCTURAL DECONSTRUCTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For each visible structural component, output its EXACT technical label:

BODICE OPTIONS: Princess-seam bodice / Darted bodice / Yoke bodice / Bustier / Boned corset / Bias-cut bodice
NECKLINE OPTIONS: Sweetheart / Off-shoulder / Cowl / V-neck (depth in cm if visible) / Strapless / Halter / Bateau / Scoop / Square / Asymmetric
SLEEVE OPTIONS: Set-in / Raglan / Magyar/Dolman / Kimono / Dropped-shoulder — then: Straight / Bishop / Bell/Pagoda / Puff / Flutter / Cap / None
WAISTLINE: Natural waist seam / Dropped waist / Empire waist / Basque V-waist / Elasticated waist / Waistband (cm estimated width) / No waistline seam
LOWER SECTION: A-line / Flared / Pleated / Gathered / Draped / Wrap / Pencil/Column / Peplum / Asymmetric hem / High-low
CLOSURE: Invisible zip (center-back/side seam) / Exposed zip / Hook-and-eye / Buttons (spacing visible) / Ties / Snap tape / Lace-up

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: PATTERN PIECE BREAKDOWN (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
List EVERY pattern piece required for cutting. Format exactly as:

BODICE:
• Front bodice panel × 2 (cut on fold if center front has no seam)
• Back bodice panel × 2
• Side front panel × 2 [Princess seam piece]
• Side back panel × 2 [Princess seam piece]
• Neckline facing × 1 (cut on fold) / Bias-cut binding strip

SLEEVES (if present):
• Sleeve crown panel × 2
• Under-sleeve panel × 2 [for 2-piece sleeve construction]
• Cuff × 2 (interfaced) [if applicable]

LOWER SECTION:
• Front skirt panel × 1 (cut on fold) or × 2
• Back skirt panel × 2
• Side gores × 2–8 [number based on visible panels]
• Waistband × 1 (interfaced, cut on cross-grain)

LINING (if structured):
• Front lining × 2 / Back lining × 2 [with ease pleat at CB]

Use "× N" for cut quantity. Note "CUT ON FOLD" or "CUT ON CROSS-GRAIN" where applicable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4: FABRIC & INTERNAL SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FABRIC: Identify primary fabric. Use technical names: Woven cotton batik / Duchess satin / Crepe-back satin / Silk chiffon / Heavy linen / Stretch velvet / Ponte Roma / Denim twill / etc.
INTERFACING: Specify EXACTLY where: "Waistband — sew-in interfacing. Bodice back — woven fusible interfacing. Collar stand — medium-weight iron-on."
BONING/SUPPORT: Specify: "Spiral steel boning at side seams and princess seams of bodice. 6mm width channels." OR "No boning required."
UNDERLINING: "Full underlining in cotton batiste recommended for structured drape."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5: SEAM & DART SPECIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Standard seam allowance: 1.5cm throughout
• Dart placement: Identify type (bust dart, waist dart, elbow dart, shoulder dart) and estimated angle/depth
• Notch positions: Identify where matching notches would be placed (shoulder, side seam, sleeve cap)
• Hem allowance: Estimate from visible hem width (typically 2–5cm depending on fabric weight)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 6: SEWING CONSTRUCTION SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Professional sewing order (10–14 steps). Rules:
- Interface and stay-stitch FIRST, before any joining
- Build bodice structure before adding skirt
- Install zip/closure last on main fabric, before lining
- Attach lining by slip-stitch or machine-bag method
- Decorative elements ALWAYS last

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 7: VALIDATION & SEWABILITY CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Is the garment physically sewable as described?
- Are all seams balanced (do side seams match front/back lengths)?
- Any construction challenges a tailor should know?
- State confidence: High (all details clearly visible) / Medium (some inference required) / Low (significant portions hidden or ambiguous)

Return structured JSON with:
- garment_type: full precise formula title
- silhouette: shape classification with technical descriptor
- neckline: precise technical name + depth/width if visible
- sleeve_type: attachment method + silhouette name + any special features
- structural_components: array — structural elements only, no decoration
- pattern_pieces: string — full Phase 3 breakdown with cut quantities and grain notes (use \\n for line breaks)
- decorative_elements: array — non-structural only (beads, embroidery, appliqué, overlay lace, fringe, etc.)
- fabric_type: technical fabric name(s)
- interfacing_notes: precise placement by garment section
- support_notes: boning specifications, underlining, padding
- construction_order: array of 10–14 numbered professional sewing steps
- validation_notes: array — sewability concerns, uncertain elements, matching challenges
- technical_notes: array — professional tailor notes (pressing, ease allowances, grain pitfalls, special techniques)
- analysis_summary: 3–4 sentence professional construction summary
- reconstruction_notes: specific instructions for the pattern drafter (grain direction, ease amounts, critical measurements)
- confidence_level: High / Medium / Low

CRITICAL: Be 100% faithful to what is PHYSICALLY VISIBLE. Do NOT invent hidden details. If obscured → state "Not fully visible — likely [inference]".
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: ANALYSIS_PROMPT,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            garment_type: { type: 'string' },
            silhouette: { type: 'string' },
            neckline: { type: 'string' },
            sleeve_type: { type: 'string' },
            structural_components: { type: 'array', items: { type: 'string' } },
            pattern_pieces: { type: 'string' },
            decorative_elements: { type: 'array', items: { type: 'string' } },
            fabric_type: { type: 'string' },
            interfacing_notes: { type: 'string' },
            support_notes: { type: 'string' },
            construction_order: { type: 'array', items: { type: 'string' } },
            validation_notes: { type: 'array', items: { type: 'string' } },
            technical_notes: { type: 'array', items: { type: 'string' } },
            analysis_summary: { type: 'string' },
            reconstruction_notes: { type: 'string' },
            confidence_level: { type: 'string' }
          }
        }
      });

      setAnalysis(result);
      setConfirmed(false);
      setStep(2);
    } catch (err) {
      console.error(err);
    }
    setAnalysisLoading(false);
  };

  // ── Save to Knowledge Base ────────────────────────────────────────────────
  const handleConfirmAnalysis = async (yes) => {
    if (!yes) {
      setStep(1);
      setAnalysis(null);
      setUserFeedback('');
      return;
    }
    setConfirmed(true);
    // Save verified analysis as a "Golden Record" in GeneratedDesigns entity
    try {
      const { base44: sdk } = await import('@/api/base44Client');
      await sdk.entities.GeneratedDesigns.create({
        user_id: currentUser?.id || 'unknown',
        image_url: uploadedFileUrl || imagePreview || '',
        prompt: analysis.garment_type,
        design_type: JSON.stringify({
          silhouette: analysis.silhouette,
          neckline: analysis.neckline,
          sleeve_type: analysis.sleeve_type,
          structural_components: analysis.structural_components,
          decorative_elements: analysis.decorative_elements,
          fabric_type: analysis.fabric_type,
          reconstruction_notes: analysis.reconstruction_notes,
          tags: [
            analysis.sleeve_type,
            analysis.neckline,
            analysis.silhouette,
            analysis.fabric_type
          ].filter(Boolean)
        })
      });
    } catch (e) {
      console.error('Knowledge base save failed', e);
    }
  };

  // ── Step 3: Generate Illustration ─────────────────────────────────────────
  const handleGenerateIllustration = async () => {
    if (!analysis) return;

    // Free users: check credits
    if (!isPro && !hasCredits) {
      if (showGoPremium) {
        setShowUpgradeModal(true);
      } else {
        setShowAdModal(true);
      }
      return;
    }

    setConfirmed(false);
    setIllustrationLoading(true);

    if (!isPro) {
      const result = await deductCredit();
      if (!result?.success) { setIllustrationLoading(false); return; }
    }

    try {
      // Build a precise illustration prompt from the analysis + any user corrections
      const corrections = userFeedback.trim()
        ? `\n\nUSER CORRECTIONS (apply these FIRST, they override the analysis):\n"${userFeedback.trim()}"`
        : '';

      const illustrationPrompt = `[TAILORIX AI — MASTER TECHNICAL RECONSTRUCTION SYSTEM v3]
You are Tailorix AI's Lead Technical Illustrator and Pattern Engineer. Your single task: produce the highest-fidelity technical reconstruction illustration possible of the garment analyzed below. This is NOT a fashion mood illustration — it is an engineering-grade technical drawing used for physical pattern drafting.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFIED GARMENT ENGINEERING DATA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Garment Classification: ${analysis.garment_type}
Silhouette: ${analysis.silhouette}
Neckline (precise): ${analysis.neckline}
Sleeve Type: ${analysis.sleeve_type || 'None — sleeveless'}
Structural Components: ${(analysis.structural_components || []).join(' | ')}
Pattern Pieces Required: ${analysis.pattern_pieces || 'Per standard construction'}
Decorative Elements (non-structural): ${(analysis.decorative_elements || []).join(' | ') || 'None'}
Fabric Classification: ${analysis.fabric_type || 'Not specified'}
Interfacing Zones: ${analysis.interfacing_notes || 'None specified'}
Internal Support: ${analysis.support_notes || 'None'}
Seam/Dart Notes: ${(analysis.technical_notes || []).join(' | ')}
Reconstruction Brief: ${analysis.reconstruction_notes}
Confidence Level: ${analysis.confidence_level}${corrections}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ILLUSTRATION ENGINEERING RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE 1 — SILHOUETTE FIDELITY (NON-NEGOTIABLE):
Trace the EXACT outer silhouette from the uploaded garment photo. Every curve, flare angle, hem shape, and waistline dip must match the source image precisely. If the garment has an asymmetric hem — draw it asymmetric. If the hip flares at exactly 45° — draw 45°. ZERO artistic license with the silhouette shape.

RULE 2 — PANEL COUNT ACCURACY:
Count and draw EVERY visible panel seam in the original garment. 6 panels → draw 6 panels. 9 panels → draw 9 panels. Each panel must be a distinct region bounded by seam lines.

RULE 3 — SEAM LINE HIERARCHY (mandatory line weight system):
• Outer silhouette edge: 3pt solid black stroke
• Internal construction seam lines (Princess seams, panel joins): 1.5pt solid dark stroke
• Dart lines: 0.7pt dashed lines with arrowhead pointing toward dart apex
• Gathering/smocking lines: 0.5pt parallel wavy lines
• Fold/pleat lines: 0.7pt dot-dash lines with "FOLD" label
• Boning channel lines: 0.5pt parallel dashed lines labeled "BONING"
• Zip placement: 0.7pt dashed centerline labeled "ZIP OPENING"

RULE 4 — VERTICAL CONTINUITY:
If the fabric flows unbroken through the waist in the original — DO NOT add a horizontal waist seam line. The waist is a width coordinate only. Only draw a horizontal waist seam where a physical stitch line, color break, or seam band is VISIBLY present in the photo.

RULE 5 — CONSTRUCTION DETAIL MARKERS:
Show the following directly on the illustration:
• Dart positions: triangular dart shape with stitch-to-point direction marked
• Notch marks: small perpendicular tick marks at every seam junction
• Grain arrows: vertical double-headed arrows on each main panel
• Ease marks: small arrows labeled "EASE" at sleeve cap and hip

RULE 6 — PROFESSIONAL ANNOTATION (mandatory labels):
Label each major section with clean, small uppercase sans-serif text:
"FRONT BODICE" | "SIDE PANEL" | "BACK PANEL" | "SLEEVE HEAD" | "SLEEVE BODY" | "WAISTBAND" | "FRONT SKIRT" | "BACK SKIRT" | "NECKLINE FACING" | "ZIP PLACKET" — only label what is present.

RULE 7 — OVERRIDE PROTOCOL:
If user corrections are provided — they override ALL visual data. Apply immediately with no exceptions.

RULE 8 — PASS/FAIL TEST:
A master tailor who has seen the original garment must immediately recognize this illustration as the same garment. If the silhouette, panel count, neckline shape, or sleeve type do not match — the illustration has FAILED.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RENDER SPECIFICATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${isPro ? `PREMIUM — Ghost Mannequin + Full Fabric Rendering:
• Render the garment on a GHOST MANNEQUIN (invisible body, garment holds 3D form in space).
• FABRIC CLONING: Extract the exact fabric pattern, print, texture, and color from the uploaded photo. Map it onto the garment surface at 100% fidelity — correct print scale, color saturation, and placement.
• Fabric behavior: Show realistic drape, sheen, or stiffness appropriate to the fabric type identified.
• Lighting: Soft studio rim lighting to show 3D volume. Gentle shadow cast.
• Background: Deep navy (#0A0A2A) gradient — premium boutique presentation.
• Signature palette: Rich indigo, warm gold accent for panel labels. Boutique-quality digital render.
• Small Tailorix AI gold watermark, bottom right corner.` : `FREE — Pure Professional Technical Flat:
• Render as a CRISP PROFESSIONAL TECHNICAL FLAT DRAWING on a pure white background.
• NO color fills, NO fabric texture, NO shading, NO watercolor, NO painted effects.
• All surfaces: clean white fill bounded by precise black/dark-indigo line strokes only.
• Line weights exactly as specified in Rule 3 above.
• Front view, flat lay orientation — no body, no mannequin, no model.
• Style reference: high-quality professional sewing pattern diagram, as found in Vogue Patterns or Burda Style technical sheets.
• Small Tailorix AI gray watermark, bottom right corner.`}`;

      const img = await base44.integrations.Core.GenerateImage({
        prompt: illustrationPrompt,
        existing_image_urls: uploadedFileUrl ? [uploadedFileUrl] : undefined
      });
      if (img?.url) {
        setIllustrationUrl(img.url);
        setStep(3);
      }
    } catch (err) {
      console.error(err);
    }
    setIllustrationLoading(false);
  };

  // ── Step 4: Generate Pattern Layout ───────────────────────────────────────
  const handleGeneratePattern = async () => {
    if (!illustrationUrl) return;
    setPatternLoading(true);

    try {
      const corrections = userFeedback.trim() ? `User corrections: "${userFeedback.trim()}"` : '';

      const patternPrompt = `[TAILORIX AI — MASTER PATTERN DRAFTING SYSTEM v3]

You are Tailorix AI's Chief Pattern Drafter. Using the reconstruction illustration provided, produce a PROFESSIONALLY DRAFTED, PRODUCTION-READY flat pattern layout board. Every pattern piece must be mathematically accurate, fully labelled, and directly traceable from the illustration. No generic templates — every piece is derived from this specific garment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GARMENT ENGINEERING DATA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Garment: ${analysis?.garment_type || 'Garment'}
Silhouette: ${analysis?.silhouette || 'Unknown'}
Neckline: ${analysis?.neckline || 'Unknown'}
Sleeve: ${analysis?.sleeve_type || 'None'}
Structural Components: ${(analysis?.structural_components || []).join(' | ')}
Pattern Pieces Required: ${analysis?.pattern_pieces || 'Per standard construction'}
Fabric: ${analysis?.fabric_type || 'Unknown'}
Interfacing Zones: ${analysis?.interfacing_notes || 'None'}
Support/Boning: ${analysis?.support_notes || 'None'}
Construction Sequence: ${(analysis?.construction_order || []).join(' → ')}
Technical Notes: ${(analysis?.technical_notes || []).join(' | ')}
Reconstruction Notes: ${analysis?.reconstruction_notes || ''}
${corrections}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION A — GARMENT REFERENCE PANEL (top 12% of image)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Clean front-view technical illustration of the garment (derived from reconstruction illustration).
• Alongside it: key construction callout labels pointing to major structural features.
• Header text: "TAILORIX AI — GARMENT REFERENCE | ${analysis?.garment_type || 'GARMENT'}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION B — PATTERN PIECE DRAFTING GRID (middle 55% of image)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Draw ALL pattern pieces on a GRAPH-PAPER GRID background (5mm squares). No pieces overlapping. Organized by garment section (bodice pieces left cluster, skirt/trouser pieces right cluster, sleeves top-right, accessories bottom-right).

MANDATORY MARKINGS ON EVERY PATTERN PIECE:

① PIECE IDENTIFICATION LABEL (bold uppercase, centered):
   Format: "FRONT BODICE PANEL — CUT 2 | MAIN FABRIC"
   Sub-label (italic, smaller): e.g. "Princess seam — match notch A to notch A on Side Front"

② GRAINLINE ARROW:
   Vertical double-headed arrow spanning full piece height.
   Label: "GRAIN ↕" parallel to arrow.
   For bias cut pieces: diagonal arrow labeled "BIAS GRAIN ↗"

③ SEAM ALLOWANCE ZONE:
   Dashed inner border exactly 1.5cm from cut edge all around.
   Label at one corner: "S.A. = 1.5cm"
   At hems: note "HEM ALLOWANCE = 3cm" separately.

④ DARTS (where applicable):
   Triangle shape with two legs and a point. Label: "BUST DART — stitch to within 1.5cm of point, press toward CF/waist"
   OR "WAIST DART — stitch to point, press toward CB"

⑤ NOTCHES:
   Single notch (▷) at front seam junctions.
   Double notch (▷▷) at back seam junctions.
   Label key in legend box.

⑥ BALANCE MARKS:
   Small horizontal lines at every curved seam join (neckline, armhole, sleeve cap).
   Label: "BALANCE MARK"

⑦ CONSTRUCTION ZONES (fill or line patterns):
   Interfacing area: CROSS-HATCH (////) fill. Label: "FUSE INTERFACING HERE — medium woven/iron-on"
   Boning channel: parallel dashed lines 6mm apart. Label: "BONING CHANNEL — insert [X]mm spiral steel"
   Gathering line: small inward arrows. Label: "GATHER BETWEEN NOTCHES to [X]cm"
   Stay-stitch zone: dotted border near bias edges. Label: "STAY-STITCH 1cm from edge before cutting"

⑧ FOLD INDICATOR:
   Dashed center line at fold edge. Label: "PLACE ON FOLD — do not add SA here"

⑨ ZIP PLACEMENT:
   Dashed rectangle 2cm wide on relevant seam. Label: "ZIP OPENING — leave unstitched. Invisible zip method."

LEGEND BOX (bottom-left of grid):
   ▷ = Front notch | ▷▷ = Back notch | //// = Interfacing | ═══ = Boning | - - - = Fold line | S.A. = Seam Allowance 1.5cm

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION C — PROFESSIONAL CONSTRUCTION GUIDE (bottom 33% of image)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Header: "TAILORIX AI CONSTRUCTION GUIDE — Step-by-Step Sewing Sequence"

Present as numbered steps in clean, mentor-to-apprentice English. Minimum 10 steps:

PRE-CONSTRUCTION:
1. PREPARE FABRIC: Pre-wash and press all fabric. Cut all pieces on correct grain per pattern markings.
2. INTERFACE: Fuse interfacing to all marked zones (waistband, neckline facing, zip placket) before any sewing.
3. STAY-STITCH: All bias-cut or curved edges (neckline, armhole) stay-stitched at 0.9cm to prevent stretching.

STRUCTURAL BUILD:
4. DARTS FIRST: Stitch all darts. Press bodice darts toward CF; waist darts toward CB. Use tailor's ham for curved pressing.
5. PRINCESS SEAMS (if applicable): Join side-front to front, side-back to back. Clip curves every 1cm. Press open or toward side panels.
6. ASSEMBLE BODICE: Join front to back at shoulder seams. Press open. Then join side seams.
7. LOWER SECTION: Assemble skirt/trouser panels. Join side seams. If gathered, stitch gathering rows first at 0.5cm and 0.8cm, then draw to waist measurement.

CLOSURES & FINISHING:
8. ZIP INSTALLATION: Apply invisible zip using "uncurl-and-iron" method. Interface zip tape with knit interfacing strip for wave-free finish.
9. JOIN SECTIONS: Attach bodice to skirt/trouser at waist seam. Distribute ease evenly. Press seam up into bodice.
10. WAISTBAND (if separate): Attach curved waistband. Understitch facing side. Stitch-in-the-ditch from exterior.
11. SLEEVES (if applicable): Set sleeves into armhole, distributing ease at crown. Machine-baste first, adjust, then stitch. Clip armhole SA every 2cm.
12. LINING: Assemble lining separately. Attach at neckline/zip by machine. Slip-stitch hem to garment hem allowance.
13. HEMMING: Turn up and press hem. Catchstitch by hand for formal garments, or machine blind-hem for casual.
14. FINAL PRESSING: Press entire garment using appropriate press cloth and tailor's ham for 3D curves. Steam set all seams.

VISUAL STYLE:
${isPro ? `PREMIUM BOARD — Indigo & Gold Professional:
• Garment in Section A: Ghost Mannequin render with full fabric texture cloned from original photo.
• Pattern pieces in Section B: Each piece filled with the exact fabric print/texture from the garment at correct density and scale.
• Background: deep #0A0A2A navy. Section dividers: bold gold lines with centered gold section headers.
• Typography: clean bold sans-serif labels in white/gold. Italic teaching notes in soft gold.
• Legend box: dark card with gold border. Overall: premium fashion atelier presentation board.` : `FREE BOARD — Professional Technical Draft:
• All sections: clean white background.
• Garment reference (Section A): crisp technical flat line art, black ink on white.
• Pattern pieces (Section B): plain white fill, precise black/dark-indigo outlines, all markings in dark ink.
• No color, no texture, no fabric fills — professional printed-pattern quality.
• Typography: clean sans-serif labels in dark slate. Section headers in bold dark-indigo.
• Section dividers: bold dark horizontal rules. Legend box with clean border.`}`

      const img = await base44.integrations.Core.InvokeLLM({
        prompt: patternPrompt,
        file_urls: [illustrationUrl],
        model: 'gemini_3_1_pro',
        response_json_schema: {
          type: 'object',
          properties: {
            image_prompt: { type: 'string' }
          }
        }
      });

      // Use the illustration-grounded prompt to generate the final image
      const finalPrompt = img?.image_prompt || patternPrompt;
      const generatedImg = await base44.integrations.Core.GenerateImage({
        prompt: finalPrompt,
        existing_image_urls: [illustrationUrl]
      });
      const imgResult = generatedImg;
      if (imgResult?.url) {
        setPatternUrl(imgResult.url);
        setStep(4);
        triggerReview();
      }
    } catch (err) {
      console.error(err);
    }
    setPatternLoading(false);
  };

  const handleDownloadPattern = async () => {
    if (!patternUrl) return;
    try {
      const response = await fetch(patternUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `tailorix-pattern-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // fallback
      window.open(patternUrl, '_blank');
    }
  };

  const resetAll = () => {
    setStep(1);
    setUploadedImage(null);
    setImagePreview(null);
    setAnalysis(null);
    setUserFeedback('');
    setIllustrationUrl(null);
    setPatternUrl(null);
    setUploadedFileUrl(null);
    setConfirmed(false);
  };

  return (
    <div className={pageBg}>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 ${
              isPro ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30' : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              <Scissors className="w-3.5 h-3.5" />
              Tailorix Deconstruct
            </div>
            <h1 className={`text-2xl md:text-3xl font-bold ${titleColor}`}>Garment Deconstruction</h1>
            <p className={`text-xs mt-0.5 ${subColor}`}>Analyze · Confirm · Illustrate · Draft Pattern</p>
          </div>
          <CreditCapsule credits={credits} isPremium={isPro} loading={creditsLoading} />
        </motion.div>

        {/* ── Step Tracker ── */}
        <div className="flex items-center gap-1 mb-8 flex-wrap">
          {[
            { num: '1', label: 'Upload & Analyze' },
            { num: '2', label: 'Confirm' },
            { num: '3', label: 'Illustration' },
            { num: '4', label: 'Pattern' },
          ].map(({ num, label }, i) => (
            <React.Fragment key={num}>
              <button
                onClick={() => { if (parseInt(num) < step) setStep(parseInt(num)); }}
                disabled={parseInt(num) >= step}
                className="disabled:cursor-default"
              >
                <StepBadge num={num} label={label} active={step === parseInt(num)} done={step > parseInt(num)} isPremium={isPro} />
              </button>
              {i < 3 && <div className={`h-px flex-1 min-w-[8px] ${isPro ? 'bg-indigo-800' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════
              STEP 1: Upload & Analyze
          ══════════════════════════════════════ */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* ── Instructional Banner ── */}
              <div className={`mb-4 rounded-xl p-4 flex items-start gap-3 border ${isPro ? 'bg-indigo-950/60 border-indigo-500/30 text-indigo-200' : 'bg-amber-50 border-amber-300 text-amber-900'}`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isPro ? 'text-indigo-400' : 'text-amber-600'}`} />
                <div className="text-sm leading-relaxed">
                  <span className="font-bold">For 100% accuracy:</span> Please upload a clear, full image of the garment. Ensure there are no obstructions (arms blocking the chest, bags, or poor lighting) so Tailorix AI can accurately scan every detail.
                </div>
              </div>
              <AILoadingNotice dark={isPro} className="mb-4" />
              <div className={`rounded-2xl p-8 ${cardBg} text-center max-w-xl mx-auto`}>
                <SectionHeader
                  icon={<Upload className={`w-5 h-5 ${isPro ? 'text-indigo-400' : 'text-rose-500'}`} />}
                  title="Upload Garment Photo"
                  sub="Clear front-view photo gives best results"
                  isPremium={isPro}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden mb-6 ${
                    imagePreview ? 'border-transparent' : isPro
                      ? 'border-indigo-500/40 hover:border-indigo-400/70 bg-indigo-950/30'
                      : 'border-slate-300 hover:border-rose-400 bg-slate-50 hover:bg-rose-50/30'
                  }`}
                  style={{ minHeight: 260 }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Uploaded garment" className="w-full object-contain max-h-[340px]" />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isPro ? 'bg-indigo-900/60' : 'bg-slate-100'}`}>
                        <Upload className={`w-8 h-8 ${isPro ? 'text-indigo-400' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className={`font-semibold text-base ${titleColor}`}>Tap to upload garment photo</p>
                        <p className={`text-xs mt-1 ${subColor}`}>JPG or PNG · Front view recommended</p>
                      </div>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

                {imagePreview && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-3">
                    <Button
                      onClick={handleAnalyze}
                      disabled={analysisLoading}
                      className={`w-full py-5 text-base font-bold rounded-xl ${isPro ? goldBtn : accentBtn}`}
                    >
                      {analysisLoading
                        ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analysing Garment Structure...</>
                        : <><Sparkles className="w-5 h-5 mr-2" />Analyze Garment (Free)</>}
                    </Button>
                    <button onClick={() => { setImagePreview(null); setUploadedImage(null); }} className={`text-xs ${subColor} hover:underline`}>
                      Choose a different photo
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════
              STEP 2: Confirm Analysis
          ══════════════════════════════════════ */}
          {step === 2 && analysis && (
            <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Photo */}
                <div className={`rounded-2xl overflow-hidden ${cardBg} flex items-center justify-center`} style={{ minHeight: 300 }}>
                  {imagePreview && <img src={imagePreview} alt="Garment" className="w-full object-contain max-h-[400px]" />}
                </div>

                {/* Analysis */}
                <div className={`rounded-2xl p-6 flex flex-col gap-4 ${cardBg}`}>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isPro ? 'text-indigo-400' : 'text-rose-500'}`}>
                      Step 1 Complete — Garment Engineering Analysis
                    </p>
                    <h2 className={`text-xl font-bold ${titleColor}`}>{analysis.garment_type}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {analysis.silhouette && <Tag isPremium={isPro}>{analysis.silhouette}</Tag>}
                      {analysis.confidence_level && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                          analysis.confidence_level === 'High' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : analysis.confidence_level === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-red-50 border-red-200 text-red-600'
                        }`}>{analysis.confidence_level} Confidence</span>
                      )}
                    </div>
                  </div>

                  {/* Structural Components */}
                  {analysis.structural_components?.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold mb-1 ${isPro ? 'text-indigo-400' : 'text-rose-500'}`}>Structural Components</p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.structural_components.map((c, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${isPro ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key construction fields */}
                  <div className="space-y-3">
                    {[
                      { label: 'Neckline', value: analysis.neckline },
                      { label: 'Sleeve Type', value: analysis.sleeve_type },
                      { label: 'Fabric Type', value: analysis.fabric_type },
                      { label: 'Interfacing', value: analysis.interfacing_notes },
                      { label: 'Support / Boning', value: analysis.support_notes },
                    ].map(({ label, value }) => value && value !== 'None' && (
                      <div key={label}>
                        <p className={`text-xs font-bold mb-0.5 ${isPro ? 'text-indigo-400' : 'text-rose-500'}`}>{label}</p>
                        <p className={`text-sm ${isPro ? 'text-indigo-100' : 'text-slate-700'}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pattern Pieces */}
                  {analysis.pattern_pieces && (
                    <div>
                      <p className={`text-xs font-bold mb-1 ${isPro ? 'text-indigo-400' : 'text-rose-500'}`}>Pattern Pieces</p>
                      <pre className={`text-xs whitespace-pre-wrap leading-relaxed rounded-xl p-3 border ${isPro ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-200' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>{analysis.pattern_pieces}</pre>
                    </div>
                  )}

                  {/* Decorative Elements */}
                  {analysis.decorative_elements?.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold mb-1 ${isPro ? 'text-indigo-400' : 'text-rose-500'}`}>Decorative Elements <span className="font-normal opacity-60">(non-structural)</span></p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.decorative_elements.map((d, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${isPro ? 'bg-amber-900/30 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Construction Order */}
                  {analysis.construction_order?.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold mb-1 ${isPro ? 'text-indigo-400' : 'text-rose-500'}`}>Construction Order</p>
                      <ol className={`text-xs space-y-1 list-decimal list-inside ${isPro ? 'text-indigo-200' : 'text-slate-700'}`}>
                        {analysis.construction_order.map((step, i) => <li key={i}>{step}</li>)}
                      </ol>
                    </div>
                  )}

                  {/* Validation Notes */}
                  {analysis.validation_notes?.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold mb-1 ${isPro ? 'text-yellow-400' : 'text-amber-600'}`}>⚠️ Validation Check</p>
                      <ul className={`text-xs space-y-1 list-disc list-inside ${isPro ? 'text-yellow-200' : 'text-amber-700'}`}>
                        {analysis.validation_notes.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Technical Notes */}
                  {analysis.technical_notes?.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold mb-1 ${isPro ? 'text-indigo-400' : 'text-rose-500'}`}>Technical Notes</p>
                      <ul className={`text-xs space-y-1 list-disc list-inside ${isPro ? 'text-indigo-200' : 'text-slate-600'}`}>
                        {analysis.technical_notes.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Summary */}
                  {analysis.analysis_summary && (
                    <div className={`rounded-xl p-3 border text-sm leading-relaxed italic ${isPro ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-200' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                      {analysis.analysis_summary}
                    </div>
                  )}

                  {/* Reconstruction Notes */}
                      <div className={`rounded-xl p-3 border text-sm ${isPro ? 'border-indigo-500/20 bg-indigo-950/30 text-indigo-200' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
                        <p className="font-semibold mb-1">Reconstruction Notes</p>
                        <p className="leading-relaxed">{analysis?.reconstruction_notes}</p>
                      </div>

                      {/* User corrections */}
                      <div>
                        <label className={`text-xs font-bold block mb-1.5 ${isPro ? 'text-indigo-300' : 'text-slate-600'}`}>
                          Corrections / Adjustments <span className={`font-normal ${subColor}`}>(optional)</span>
                        </label>
                        <Textarea
                          rows={3}
                          placeholder={`e.g. "The sleeves are actually cap sleeves, not pagoda."`}
                          value={userFeedback}
                          onChange={(e) => setUserFeedback(e.target.value)}
                          className={`text-sm resize-none ${
                            isPro || isDark
                              ? 'bg-[#1A1F2E] border-slate-700 text-[#F5F5F5] placeholder:text-[#888888]'
                              : 'bg-white text-slate-900 placeholder:text-slate-400'
                          }`}
                        />
                      </div>

                      <div className="relative">
                        <Button
                          onClick={handleGenerateIllustration}
                          disabled={illustrationLoading || (!isPro && !hasCredits)}
                          className={`w-full py-5 font-bold text-sm rounded-xl relative z-10 ${isPro ? goldBtn : accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {illustrationLoading
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Illustration...</>
                            : <><Wand2 className="w-4 h-4 mr-2" />{isPro ? 'Generate Reconstruction Illustration (Pro)' : 'Generate Illustration — 1 Credit 💎'}</>}
                        </Button>
                      </div>

                  {!isPro && !hasCredits && (
                        <div className={`rounded-xl p-3 flex items-center gap-3 border mt-1 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          {showGoPremium ? (
                            <>
                              <Lock className="w-4 h-4 flex-shrink-0 text-rose-400" />
                              <p className={`text-xs flex-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Daily ad limit reached. Upgrade for unlimited access.</p>
                              <Button size="sm" onClick={() => setShowUpgradeModal(true)} className="text-xs px-3 bg-rose-500 hover:bg-rose-600 text-white flex-shrink-0"><Crown className="w-3 h-3 mr-1" />Upgrade</Button>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 flex-shrink-0 text-blue-400" />
                              <p className={`text-xs flex-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Watch an ad to earn +1 credit ({5 - (dailyAdsWatched ?? 0)} left today)</p>
                              <Button size="sm" onClick={() => setShowAdModal(true)} className="text-xs px-3 bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0">Watch Ad</Button>
                            </>
                          )}
                        </div>
                      )}

                  <button onClick={() => setStep(1)} className={`w-full text-center text-xs ${subColor} hover:underline`}>← Re-upload photo</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════
              STEP 3: Illustration Result
          ══════════════════════════════════════ */}
          {step === 3 && illustrationUrl && (
            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className={`rounded-2xl p-6 mb-4 ${cardBg}`}>
                <SectionHeader
                  icon={<Wand2 className={`w-5 h-5 ${isPro ? 'text-yellow-400' : 'text-rose-500'}`} />}
                  title="Reconstruction Illustration"
                  sub="Click any image to zoom. Review accuracy before generating the pattern."
                  isPremium={isPro}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 text-center ${subColor}`}>Original Garment</p>
                    <ZoomableImage src={imagePreview} label="Original Garment" isPremium={isPro} className="bg-white rounded-2xl" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 text-center ${isPro ? 'text-yellow-400' : 'text-rose-500'}`}>Tailorix Reconstruction</p>
                    <ZoomableImage src={illustrationUrl} label="Reconstruction Illustration" isPremium={isPro} className={`rounded-2xl ${cadBoardBg}`} />
                  </div>
                </div>

                <div className={`rounded-xl p-4 border mb-4 text-sm ${isPro ? 'border-indigo-500/20 bg-indigo-950/30 text-indigo-200' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
                  <p className="font-semibold mb-1">Reconstruction Notes</p>
                  <p className="leading-relaxed">{analysis?.reconstruction_notes}</p>
                </div>

                {/* ── YES/NO SAFETY GATEWAY (Step 3) ── */}
                {!confirmed ? (
                  <div className={`rounded-xl p-4 border ${isPro ? 'bg-indigo-950/60 border-indigo-400/40' : 'bg-rose-50 border-rose-200'}`}>
                    <p className={`text-sm font-bold mb-1 ${isPro ? 'text-white' : 'text-slate-800'}`}>Does this reconstruction accurately clone the uploaded garment?</p>
                    <p className={`text-xs mb-3 ${subColor}`}>Check silhouette, panels, neckline, and structural details before proceeding.</p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleConfirmAnalysis(true)}
                        className={`flex-1 font-bold rounded-xl ${isPro ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                      >
                        ✅ Yes — Generate Pattern
                      </Button>
                      <Button
                        onClick={() => handleConfirmAnalysis(false)}
                        variant="outline"
                        className={`flex-1 font-bold rounded-xl ${isPro ? 'border-red-500 text-red-400 hover:bg-red-900/20' : 'border-red-300 text-red-500 hover:bg-red-50'}`}
                      >
                        ❌ No — Re-analyze
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className={`rounded-xl p-3 border text-xs font-semibold flex items-center gap-2 ${isPro ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                      ✅ Illustration confirmed — generating full pattern now.
                    </div>
                    <Button
                      onClick={handleGeneratePattern}
                      disabled={patternLoading}
                      className={`w-full py-5 font-bold text-sm rounded-xl ${isPro ? goldBtn : accentBtn}`}
                    >
                      {patternLoading
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Building Pattern Layout...</>
                        : <><FileText className="w-4 h-4 mr-2" />Generate Full Pattern Layout →</>}
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep(2)} className={`flex-1 text-sm ${isPro ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : ''}`}>
                        ← Adjust Corrections
                      </Button>
                      <Button variant="outline" onClick={handleGenerateIllustration} disabled={illustrationLoading} className={`flex-1 text-sm ${isPro ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : ''}`}>
                        <Loader2 className={`w-3.5 h-3.5 mr-1 ${illustrationLoading ? 'animate-spin' : 'hidden'}`} />
                        {!illustrationLoading && <RotateCcw className="w-3.5 h-3.5 mr-1" />}
                        {illustrationLoading ? 'Regenerating...' : 'Re-generate'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════
              STEP 4: Full Pattern Board
          ══════════════════════════════════════ */}
          {step === 4 && patternUrl && (
            <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className={`rounded-2xl p-6 mb-4 ${cardBg}`}>
                <SectionHeader
                  icon={<Ruler className={`w-5 h-5 ${isPro ? 'text-yellow-400' : 'text-rose-500'}`} />}
                  title="Full Deconstruction Board"
                  sub="Click any section to zoom and inspect detail. All 3 sections are in one board."
                  isPremium={isPro}
                />

                {/* 3-panel composite board */}
                <div className="mb-4">
                  <ZoomableImage
                    src={patternUrl}
                    label="Full Deconstruction Board — tap to zoom"
                    isPremium={isPro}
                    className={`rounded-2xl ${cadBoardBg}`}
                  />
                </div>

                {/* Also show individual reference images */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 text-center ${subColor}`}>Original</p>
                    <ZoomableImage src={imagePreview} label="Original Garment" isPremium={isPro} className="bg-white rounded-xl" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 text-center ${isPro ? 'text-yellow-400' : 'text-rose-500'}`}>Illustration</p>
                    <ZoomableImage src={illustrationUrl} label="Reconstruction" isPremium={isPro} className="rounded-xl bg-slate-50" />
                  </div>
                </div>

                {/* AI accuracy notice */}
                <div className={`rounded-xl p-3 border mb-3 flex items-start gap-2 text-xs ${isPro ? 'border-yellow-500/20 bg-yellow-900/10 text-yellow-300' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span><strong>AI can make errors.</strong> If the pattern pieces don't look right or match the illustration, tap <strong>Re-generate</strong> below to try again with a fresh extraction.</span>
                </div>

                <div className={`rounded-xl p-3 border mb-4 flex items-start gap-2 text-xs ${isPro ? 'border-indigo-500/20 bg-indigo-950/30 text-indigo-300' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>The pattern board shows all 3 sections: <strong>Original Garment</strong> · <strong>Reconstruction Illustration</strong> · <strong>Pattern Layout Grid</strong>. Tap to zoom for full detail.</span>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Download */}
                  <Button
                    onClick={handleDownloadPattern}
                    className={`w-full py-4 font-bold text-sm rounded-xl ${isPro ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-900' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                  >
                    <Download className="w-4 h-4 mr-2" /> Download Pattern Board
                  </Button>

                  {/* Share to Feed */}
                  <Button
                    onClick={() => setShowFeedShare(true)}
                    className={`w-full py-4 font-bold text-sm rounded-xl ${isPro ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share to Inspiration Feed
                  </Button>

                  {/* Re-generate */}
                  <Button
                    onClick={handleGeneratePattern}
                    disabled={patternLoading}
                    variant="outline"
                    className={`w-full text-sm ${isPro ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : ''}`}
                  >
                    {patternLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 mr-2" />}
                    Re-generate Pattern Board
                  </Button>
                  <Button onClick={resetAll} variant="ghost" className={`w-full text-sm ${subColor}`}>
                    ← Start New Deconstruction
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <RateReviewModal
        trigger={reviewTrigger}
        onDismiss={resetReviewTrigger}
        isPremiumActive={isPro}
      />

      <AdWatchModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        onReward={async () => { const r = await handleAdReward(); if (r?.success) setShowAdModal(false); return r; }}
        featureType="illustrator"
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="adLimit"
        country={currentUser?.country || 'Nigeria'}
      />

      {showFeedShare && (
        <FeedShareModal
          imageUrl={patternUrl}
          garmentType={analysis?.garment_type || 'Garment'}
          onClose={() => setShowFeedShare(false)}
          isPremium={isPro}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}