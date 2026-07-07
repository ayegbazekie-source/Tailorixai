import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft,
  Upload,
  Download,
  RefreshCw,
  Loader2,
  Shirt,
  ZoomIn,
  RotateCw,
  Crown,
  Sparkles,
  Play,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CameraCapture from '../components/CameraCapture';
import WebAdWatchModal from '@/components/WebAdWatchModal';
import UpgradeModal from '../components/UpgradeModal';
import { useCreditSystem } from '@/components/useCreditSystem';
import AILoadingNotice from '@/components/AILoadingNotice';

const TEMPLATE_GALLERY = [
  // Free templates
  {
    id: 'flared_gown',
    name: "Female Flared Gown",
    imageUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697d0c21476d1c06f4d428ff/71635e725_FlaredGown.png",
    premium: false
  },
  {
    id: 'fitted_dress',
    name: "Fitted Midi Dress",
    imageUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697d0c21476d1c06f4d428ff/30ef4a6c7_FittedGown.png",
    premium: false
  },
  {
    id: 'button_down',
    name: "Button Down Shirt",
    imageUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697d0c21476d1c06f4d428ff/20f851ae3_ButtonDownshirt.png",
    premium: false
  },
  {
    id: 'short_sleeve_shirt',
    name: "Short Sleeve Shirt",
    imageUrl: "https://media.base44.com/images/public/697d0c21476d1c06f4d428ff/5bcaf9fcb_ShortSleeveShirt.png",
    premium: false
  },
  // Premium-only templates
  {
    id: 'mens_kaftan',
    name: "Men's Native Kaftan",
    imageUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697d0c21476d1c06f4d428ff/05785cd62_MensNativeKaftan.png",
    premium: true
  },
  {
    id: 'denim_jacket',
    name: "Denim Jacket",
    imageUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697d0c21476d1c06f4d428ff/69918323b_DenimJacket.png",
    premium: true
  },
  {
    id: 'mens_trouser',
    name: "Men's Baggy/Fitted Trouser",
    imageUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697d0c21476d1c06f4d428ff/7b26aaba7_MensBaggyandfittedTrouser.png",
    premium: true
  },
  {
    id: 'womens_trouser',
    name: "Female's Baggy/Fitted Trouser",
    imageUrl: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697d0c21476d1c06f4d428ff/78a93f203_FemalesBaggyandfittedTrouser.png",
    premium: true
  }
];

export default function FabricVisualizer() {
  const {
    credits, dailyAdsWatched: adsWatched, loading,
    isPremium, hasCredits, showWatchAd, showGoPremium,
    handleAdReward: handleAdRewardHook, deductCredit
  } = useCreditSystem('visualizer');
  const [selectedTemplate, setSelectedTemplate] = useState('flared_gown');
  const [fabricUrl, setFabricUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fabricScale, setFabricScale] = useState(1);
  const [fabricRotation, setFabricRotation] = useState(0);

  // Access control states
  const [accessGranted, setAccessGranted] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [deductingCredit, setDeductingCredit] = useState(false);

  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  // Auto-grant access for premium users once loaded
  useEffect(() => {
    if (!loading && isPremium) setAccessGranted(true);
  }, [loading, isPremium]);

  // Draw fabric pattern into canvas whenever fabric/scale/rotation changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricUrl) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate((fabricRotation * Math.PI) / 180);
      // Tile the fabric image at the chosen scale
      const tileW = img.naturalWidth * fabricScale;
      const tileH = img.naturalHeight * fabricScale;
      // Draw enough tiles to cover the rotated canvas fully
      const diagonal = Math.ceil(Math.sqrt(W * W + H * H));
      const startX = -diagonal;
      const startY = -diagonal;
      for (let x = startX; x < diagonal; x += tileW) {
        for (let y = startY; y < diagonal; y += tileH) {
          ctx.drawImage(img, x, y, tileW, tileH);
        }
      }
      ctx.restore();
    };
    img.src = fabricUrl;
  }, [fabricUrl, fabricScale, fabricRotation]);

  const handleStartVisualizer = async () => {
    if (isPremium) { setAccessGranted(true); return; }
    if (!hasCredits) {
      if (showGoPremium) setShowUpgradeModal(true);
      else setShowAdModal(true);
      return;
    }
    setDeductingCredit(true);
    const result = await deductCredit();
    if (result?.success) setAccessGranted(true);
    setDeductingCredit(false);
  };

  const handleAdReward = async () => {
    const result = await handleAdRewardHook();
    if (result?.success) setShowAdModal(false);
    return result;
  };

  const currentTemplate = TEMPLATE_GALLERY.find(t => t.id === selectedTemplate);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFabricUrl(file_url);
    } catch (e) {
      console.error(e);
    }
    setUploading(false);
  };

  const downloadPreview = () => {
    const W = 800, H = 1000;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = W;
    outCanvas.height = H;
    const ctx = outCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const doDownload = () => {
      const link = document.createElement('a');
      link.download = `fabric-preview-${selectedTemplate}.png`;
      link.href = outCanvas.toDataURL('image/png');
      link.click();
    };

    if (fabricUrl && currentTemplate?.imageUrl) {
      const fabricImg = new Image();
      fabricImg.crossOrigin = 'anonymous';
      fabricImg.onload = () => {
        // Draw tiled/rotated fabric
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate((fabricRotation * Math.PI) / 180);
        const tileW = fabricImg.naturalWidth * fabricScale;
        const tileH = fabricImg.naturalHeight * fabricScale;
        const diagonal = Math.ceil(Math.sqrt(W * W + H * H));
        for (let x = -diagonal; x < diagonal; x += tileW) {
          for (let y = -diagonal; y < diagonal; y += tileH) {
            ctx.drawImage(fabricImg, x, y, tileW, tileH);
          }
        }
        ctx.restore();
        // Overlay template with multiply blend
        const templateImg = new Image();
        templateImg.crossOrigin = 'anonymous';
        templateImg.onload = () => {
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(templateImg, 0, 0, W, H);
          ctx.globalCompositeOperation = 'source-over';
          doDownload();
        };
        templateImg.src = currentTemplate.imageUrl;
      };
      fabricImg.src = fabricUrl;
    } else if (currentTemplate?.imageUrl) {
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      templateImg.onload = () => { ctx.drawImage(templateImg, 0, 0, W, H); doDownload(); };
      templateImg.src = currentTemplate.imageUrl;
    }
  };

  if (loading || credits === null) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isPremium ? 'bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#1E1E1E]' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
        <div className="text-center">
          <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${isPremium ? 'text-amber-400' : 'text-indigo-500'}`} />
          <p className={isPremium ? 'text-amber-200/80' : 'text-slate-600'}>Loading visualizer...</p>
        </div>
      </div>
    );
  }

  // ─── Entry Screen (before access is granted) ────────────────────────────────
  if (!accessGranted) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${isPremium ? 'bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#1E1E1E]' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-md w-full rounded-3xl p-8 shadow-2xl border ${
            isPremium
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-amber-500/30'
              : 'bg-white border-slate-200'
          }`}
        >
          {/* Back button */}
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className={`-ml-2 mb-4 ${isPremium ? 'text-amber-300/60' : 'text-slate-500'}`}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>

          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isPremium ? 'bg-gradient-to-br from-amber-500 to-yellow-500' : 'bg-indigo-100'
          }`}>
            <Shirt className={`w-8 h-8 ${isPremium ? 'text-slate-900' : 'text-indigo-600'}`} />
          </div>

          <h1 className={`text-2xl font-bold text-center mb-1 ${isPremium ? 'text-white' : 'text-slate-900'}`}>
            Fabric Visualizer
          </h1>
          <p className={`text-center text-sm mb-6 ${isPremium ? 'text-amber-200/70' : 'text-slate-500'}`}>
            Preview your fabric on garment templates
          </p>

          {/* Credit / Premium status */}
          {isPremium ? (
            <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-500/30 rounded-2xl p-4 mb-6 text-center">
              <Crown className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-amber-300 font-semibold text-sm">Unlimited Access — Pro Member</p>
            </div>
          ) : (
            <div className={`rounded-2xl p-4 mb-6 border ${credits > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Your Credits</span>
                <span className={`text-lg font-bold ${credits > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {credits} remaining
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Ads watched today</span>
                <span>{adsWatched} / 5</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                1 credit per session · 2 free credits daily · Up to 5 extra via ads
              </p>
            </div>
          )}

          <AILoadingNotice dark={isPremium} className="mb-4" />

          {/* Start Button */}
          <Button
            onClick={handleStartVisualizer}
            disabled={deductingCredit}
            className={`w-full py-3 text-base font-bold rounded-2xl ${
              isPremium
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 border-none'
                : credits > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-none'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border-none'
            }`}
          >
            {deductingCredit ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : isPremium ? (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Open Visualizer
              </>
            ) : credits > 0 ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Use 1 Credit &amp; Start
              </>
            ) : (
              'No Credits — Earn or Upgrade'
            )}
          </Button>

          {!isPremium && !hasCredits && (
            <Button
              variant="outline"
              onClick={() => showGoPremium ? setShowUpgradeModal(true) : setShowAdModal(true)}
              className="w-full mt-3 rounded-2xl"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {showGoPremium ? 'Upgrade to Pro' : 'Watch Ad for Credits'}
            </Button>
          )}
        </motion.div>

        {/* Ad Watch Modal */}
        <WebAdWatchModal
          isOpen={showAdModal}
          onClose={() => setShowAdModal(false)}
          featureType="visualizer"
          onReward={handleAdReward}
        />

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason="adLimit"
        />
      </div>
    );
  }

  // ─── Main Visualizer (access granted) ───────────────────────────────────────
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isPremium ? 'bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#1E1E1E]' : 'bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-middle)] to-[var(--gradient-end)]'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className={`mb-4 -ml-4 ${isPremium ? 'text-amber-200/60 hover:text-amber-300' : 'text-[var(--text-secondary)]'}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Title row with credit badge */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${isPremium ? 'bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-500/30 text-amber-400' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                  <Shirt className="w-4 h-4" />
                  {isPremium && <Crown className="w-4 h-4" />}
                  Fabric Visualizer {isPremium ? 'Pro' : ''}
                </div>
                <h1 className={`text-2xl md:text-3xl font-light tracking-tight mb-2 ${isPremium ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                  Preview Your <span className={`font-semibold ${isPremium ? 'bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent' : ''}`}>Fabric</span>
                </h1>
                <p className={`text-base font-light ${isPremium ? 'text-amber-200/80' : 'text-[var(--text-secondary)]'}`}>
                  See how your fabric will look on different garment styles instantly
                </p>
              </div>

              {/* Credit/Pro Badge in header */}
              {isPremium ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-500/30 rounded-2xl">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-sm font-semibold">Pro · Unlimited</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Credits</p>
                    <p className="text-lg font-bold text-indigo-600">{credits}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Ads Today</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{adsWatched}/5</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-2xl p-6 shadow-lg border ${isPremium ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-amber-500/20' : 'bg-[var(--card-bg)] border-[var(--card-border)]'}`}>
              <Label className={`text-sm font-semibold mb-4 block ${isPremium ? 'text-amber-400' : 'text-[var(--text-primary)]'}`}>
                1. Select Garment Style
              </Label>
              <Select
                value={selectedTemplate}
                onValueChange={(val) => {
                  const tpl = TEMPLATE_GALLERY.find(t => t.id === val);
                  if (tpl?.premium && !isPremium) { setShowUpgradeModal(true); return; }
                  setSelectedTemplate(val);
                }}
              >
                <SelectTrigger className={`w-full ${isPremium ? 'bg-[#1E1E1E] border-[#D4AF37] text-[#F8F8F2]' : ''}`}>
                  <SelectValue placeholder="Choose a style" />
                </SelectTrigger>
                <SelectContent className={isPremium ? 'bg-[#1E1E1E] border-[#D4AF37]' : ''}>
                  {TEMPLATE_GALLERY.map((template) => (
                    <SelectItem
                      key={template.id}
                      value={template.id}
                      className={`${isPremium ? 'text-[#F8F8F2] focus:bg-amber-900/30 focus:text-[#D4AF37]' : ''} ${template.premium && !isPremium ? 'opacity-60' : ''}`}
                    >
                      <span className="flex items-center gap-2">
                        {template.premium && !isPremium && <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                        {template.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isPremium && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  4 premium templates unlocked with Pro
                </p>
              )}
            </div>

            <div className={`rounded-2xl p-6 shadow-lg border ${isPremium ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-amber-500/20' : 'bg-[var(--card-bg)] border-[var(--card-border)]'}`}>
              <Label className={`text-sm font-semibold mb-4 block ${isPremium ? 'text-amber-400' : 'text-[var(--text-primary)]'}`}>
                2. Upload Fabric
              </Label>

              {!fabricUrl ? (
                uploading ? (
                  <div className="w-full border-2 border-dashed border-[var(--border-primary)] rounded-xl p-8 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
                  </div>
                ) : (
                  <CameraCapture onCapture={handleFileSelect} onFileSelect={handleFileSelect} />
                )
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img src={fabricUrl} alt="Uploaded fabric" className="w-full h-24 object-cover rounded-lg" />
                    <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={() => setFabricUrl(null)}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs flex items-center gap-1 ${isPremium ? 'text-[#E6D9A5]' : 'text-[var(--text-tertiary)]'}`}>
                          <ZoomIn className="w-3 h-3" /> Scale
                        </span>
                        <span className={`text-xs ${isPremium ? 'text-[#E6D9A5]' : 'text-[var(--text-tertiary)]'}`}>{fabricScale.toFixed(1)}x</span>
                      </div>
                      <Slider value={[fabricScale]} onValueChange={([v]) => setFabricScale(v)} min={0.3} max={3} step={0.1} className="w-full" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs flex items-center gap-1 ${isPremium ? 'text-[#E6D9A5]' : 'text-[var(--text-tertiary)]'}`}>
                          <RotateCw className="w-3 h-3" /> Rotation
                        </span>
                        <span className={`text-xs ${isPremium ? 'text-[#E6D9A5]' : 'text-[var(--text-tertiary)]'}`}>{fabricRotation}°</span>
                      </div>
                      <Slider value={[fabricRotation]} onValueChange={([v]) => setFabricRotation(v)} min={0} max={360} step={15} className="w-full" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-3">
            <div className={`rounded-3xl p-6 shadow-xl border sticky top-24 ${isPremium ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-amber-500/20' : 'bg-[var(--card-bg)] border-[var(--card-border)]'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`font-semibold ${isPremium ? 'text-[#F8F8F2]' : 'text-[var(--text-primary)]'}`}>
                  Preview: {currentTemplate?.name}
                </h2>
                {fabricUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadPreview}
                    className={`gap-2 ${isPremium ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-[#000000] border-none font-bold' : ''}`}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                )}
              </div>

              <div
                ref={canvasRef}
                className="bg-white dark:bg-slate-100 rounded-2xl overflow-hidden min-h-[550px] relative"
                style={{ isolation: 'isolate' }}
              >
                {/* Fabric canvas — masked to template shape, fabric tiles/scales/rotates INSIDE */}
                {fabricUrl && currentTemplate?.imageUrl && (
                  <canvas
                    ref={fabricCanvasRef}
                    width={800}
                    height={1000}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      WebkitMaskImage: `url(${currentTemplate.imageUrl})`,
                      maskImage: `url(${currentTemplate.imageUrl})`,
                      WebkitMaskSize: 'contain', maskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center', maskPosition: 'center',
                      zIndex: 1
                    }}
                  />
                )}
                {/* Template overlay — always on top, blends to show garment lines */}
                {currentTemplate?.imageUrl && (
                  <img
                    src={currentTemplate.imageUrl}
                    alt={currentTemplate.name}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      objectFit: 'contain', mixBlendMode: 'multiply', pointerEvents: 'none', zIndex: 10
                    }}
                  />
                )}
                {!currentTemplate && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Shirt className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" />
                      <p className="text-[var(--text-secondary)]">Select a garment style to preview</p>
                    </div>
                  </div>
                )}
              </div>

              {!fabricUrl && (
                <p className={`text-center text-sm mt-4 ${isPremium ? 'text-[#E6D9A5]' : 'text-[var(--text-tertiary)]'}`}>
                  Upload a fabric photo to see it on the template
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ad Watch Modal (accessible from within visualizer too) */}
      <WebAdWatchModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        featureType="visualizer"
        onReward={handleAdReward}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="adLimit"
      />
    </div>
  );
}