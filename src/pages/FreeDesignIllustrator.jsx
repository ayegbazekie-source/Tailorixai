import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import toast, { Toaster } from 'react-hot-toast';
import { 
  ArrowLeft,
  Sparkles,
  Wand2,
  Loader2,
  Shirt,
  Download,
  RefreshCw,
  Lock,
  Crown,
  Save,
  Upload,
  Scissors
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import CreditDisplay from '../components/CreditDisplay';
import UpgradeModal from '../components/UpgradeModal';
import PublishToFeedButton from '../components/PublishToFeedButton';
import { useCreditSystem } from '@/components/useCreditSystem';
import AILoadingNotice from '@/components/AILoadingNotice';

export default function FreeDesignIllustrator() {
  const navigate = useNavigate();
  const {
    credits, loading,
    isPremium, hasCredits, deductCredit
  } = useCreditSystem('illustrator');
  const [activeTab, setActiveTab] = useState('create');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [user, setUser] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('default');

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u) navigate(createPageUrl('Landing'), { replace: true });
      else setUser(u);
    }).catch(() => navigate(createPageUrl('Landing'), { replace: true }));
    // Pre-fill from remix params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('remix_prompt')) setPrompt(urlParams.get('remix_prompt'));
  }, []);

  const handleDownload = async () => {
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tailorix-ai-design.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      // Amazon WebView fallback: show image in full-screen overlay instead of window.open
      toast('Long-press the image to save it to your device.', { icon: '📥', duration: 4000 });
    }
  };

  const examplePrompts = [
    "Fitted off-shoulder Ankara maxi gown with high slit and peplum waist",
    "Structured blazer dress with African print lining, peak lapels, and double-breasted closure",
    "High-waist palazzo trousers with wrap-front blouse in kente fabric, flutter sleeves",
    "Sweetheart neckline corset bodice with A-line tulle skirt and lace overlay"
  ];

  const generateDesign = async () => {
    if (!prompt.trim()) return;

    if (!hasCredits) {
      setShowUpgradeModal(true);
      return;
    }

    if (!isPremium) {
      const result = await deductCredit();
      if (!result?.success) return;
    }

    setGenerating(true);
    try {
      const fullPrompt = `[TAILORIX AI — PROFESSIONAL FASHION ILLUSTRATION SYSTEM]

You are a senior fashion illustrator. Produce a PROFESSIONAL FASHION ILLUSTRATION based on this design brief:

DESIGN BRIEF: "${prompt}"

ILLUSTRATION REQUIREMENTS:
• Full-length front-facing fashion croquis on an elongated 9-head figure proportion.
• Clean white background. Professional studio lighting.
• Draw EVERY seam line, panel division, dart, pleat, and detail visible from the design brief.
• Neckline, sleeves, waistline, and closures must be precise and accurate.
• Fabric grain shown via light directional shading or subtle texture — no flat block colors.
• If African print (Ankara/Kente/Adire) is mentioned — render realistic geometric/wax print pattern.
• If lace, velvet, organza, or chiffon — show appropriate fabric drape and texture.
• NO text labels, NO annotation arrows, NO construction callout boxes on the image.
• Bottom-center watermark only: "TAILORIX AI © Illustration" in small elegant serif typography.
• Subtle drop shadow under the figure for depth.

OUTPUT: One clean, professional, print-ready fashion illustration.`;

      const response = await base44.integrations.Core.GenerateImage({
        prompt: fullPrompt
      });

      setGeneratedImage(response.url);
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate design. Please try again.');
    }
    setGenerating(false);
  };

  if (loading || credits === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-violet-500" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-middle)] to-[var(--gradient-end)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4 -ml-4 text-[var(--text-secondary)]"
            onClick={() => navigate(createPageUrl('FreeHome'))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
              <Wand2 className="w-4 h-4" />
              AI Design Studio
            </div>
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl md:text-3xl font-light tracking-tight text-[var(--text-primary)]">
                Fashion/Design <span className="font-semibold">Illustrator</span>
              </h1>
              <CreditDisplay credits={credits} featureName="Illustrator" isPremium={isPremium} />
            </div>
            <p className="text-base font-light text-[var(--text-secondary)]">
              Create beautiful garment designs with AI assistance.
            </p>

            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold">⚠️ Important:</span> Download designs immediately. Watermark: 'Tailorix AI Illustration'
              </p>
            </div>
            <AILoadingNotice className="mt-3" />
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6"
        >
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-pink-500 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => setActiveTab('modify')}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'modify'
                ? 'bg-pink-500 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Modify Design
          </button>
          <button
            onClick={() => setActiveTab('convert')}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'convert'
                ? 'bg-pink-500 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Convert Style
          </button>
        </motion.div>

        {/* Tabbed Content */}
        <div className="space-y-6">
          {/* Section 1: Create New Design */}
          {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-[var(--card-bg)] rounded-xl p-6 border border-[var(--card-border)] shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-pink-500" />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create New Design</h2>
                </div>
                <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                  FREE
                </span>
              </div>
              
              <Label className="text-sm font-medium mb-2 block text-[var(--text-secondary)]">
                Describe your design
              </Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Elegant A-line dress with floral Ankara print and modern neckline..."
                className="min-h-[120px] resize-none"
              />
              
              <div className="mt-4">
                <p className="text-xs mb-2 text-[var(--text-tertiary)]">Quick ideas:</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(example)}
                      className="text-xs px-3 py-1.5 rounded-full transition-colors bg-[var(--bg-tertiary)] hover:opacity-80 text-[var(--text-secondary)]"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                {!hasCredits ? (
                  <Button
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 rounded-xl py-3 text-base text-slate-900 font-semibold"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Out of Credits — Upgrade to Pro
                  </Button>
                ) : (
                  <Button
                    onClick={generateDesign}
                    disabled={generating || !prompt.trim()}
                    className="w-full rounded-xl py-3 text-base font-bold bg-pink-500 hover:bg-pink-600"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Design...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Design
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
          )}

          {/* Section 2: LOCKED Modify Existing Design */}
          {activeTab === 'modify' && (
          <motion.div
            key="modify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-[var(--card-bg)] rounded-xl p-6 border-2 border-amber-200 shadow-lg relative opacity-60">
              <div className="absolute top-4 right-4 z-10">
                <Lock className="w-6 h-6 text-amber-500" />
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-amber-600" />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Modify Existing Design</h2>
                </div>
                <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold">
                  PREMIUM
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block text-[var(--text-secondary)]">
                    Upload Design Image
                  </Label>
                  <Button disabled className="w-full rounded-xl bg-slate-200 cursor-not-allowed">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block text-[var(--text-secondary)]">
                    Describe Modifications
                  </Label>
                  <Textarea
                    disabled
                    placeholder="e.g., Change fabric to floral print, adjust neckline..."
                    className="min-h-[100px] resize-none cursor-not-allowed bg-slate-100"
                  />
                </div>

                <Button disabled className="w-full rounded-xl bg-slate-200 cursor-not-allowed">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Modify Design
                </Button>
              </div>

              <div className="mt-4 text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800 mb-3 font-medium">
                  🔒 Modify existing designs with fabric changes and style adjustments
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setUpgradeReason('modifyLocked');
                    setShowUpgradeModal(true);
                  }}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold rounded-xl px-6"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Tailorix AI Pro
                </Button>
              </div>
            </div>
          </motion.div>
          )}

          {/* Section 3: LOCKED Convert Design */}
          {activeTab === 'convert' && (
          <motion.div
            key="convert"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-[var(--card-bg)] rounded-xl p-6 border-2 border-amber-200 shadow-lg relative opacity-60">
              <div className="absolute top-4 right-4 z-10">
                <Lock className="w-6 h-6 text-amber-500" />
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Convert Design Style</h2>
                </div>
                <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold">
                  PREMIUM
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block text-[var(--text-secondary)]">
                    Upload Design Image
                  </Label>
                  <Button disabled className="w-full rounded-xl bg-slate-200 cursor-not-allowed">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block text-[var(--text-secondary)]">
                    Describe Style Conversion
                  </Label>
                  <Textarea
                    disabled
                    placeholder="e.g., Convert this dress into a two-piece set with modern style..."
                    className="min-h-[100px] resize-none cursor-not-allowed bg-slate-100"
                  />
                </div>

                <Button disabled className="w-full rounded-xl bg-slate-200 cursor-not-allowed">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Convert Design
                </Button>
              </div>

              <div className="mt-4 text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800 mb-3 font-medium">
                  🔒 Transform complete garment styles with AI-powered conversion
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setUpgradeReason('convertLocked');
                    setShowUpgradeModal(true);
                  }}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-bold rounded-xl px-6"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Tailorix AI Pro
                </Button>
              </div>
            </div>
          </motion.div>
          )}
        </div>

        {/* Preview Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden min-h-[500px] flex flex-col shadow-lg">
              {generating ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 bg-pink-100 dark:bg-pink-900/30">
                      <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                    </div>
                    <h3 className="font-semibold mb-2 text-base text-[var(--text-primary)]">Creating Your Design</h3>
                    <p className="text-sm text-[var(--text-secondary)]">This may take a few moments...</p>
                  </div>
                </div>
              ) : generatedImage ? (
                <>
                  <div className="flex-1 p-4">
                    <img 
                      src={generatedImage} 
                      alt="Generated design"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                  <div className="p-4 border-t border-slate-200 space-y-3">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={handleDownload}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={generateDesign}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                    
                    {/* LOCKED Save to Gallery Button for Free Users */}
                    <div className="relative">
                      <PublishToFeedButton
                        imageUrl={generatedImage}
                        prompt={prompt}
                        designType="create"
                        className="w-full"
                      />
                      <Button
                        variant="outline"
                        disabled
                        className="w-full rounded-xl opacity-60 cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Save to Gallery (Premium)
                      </Button>
                      <p className="text-xs text-center text-amber-700 dark:text-amber-400 mt-1">
                        💎 Saving designs is a Premium feature
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[var(--bg-tertiary)]">
                      <Shirt className="w-8 h-8 text-[var(--text-tertiary)]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">
                      Your Design Will Appear Here
                    </h3>
                    <p className="text-sm max-w-sm text-[var(--text-secondary)]">
                      Describe your vision and Tailorix AI will generate a professional fashion illustration.
                    </p>
                  </div>
                </div>
              )}
          </div>
        </motion.div>
      </div>

      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="noCredits"
        country={user?.country || 'Nigeria'}
      />
      
      <Toaster position="top-center" />
    </div>
  );
}