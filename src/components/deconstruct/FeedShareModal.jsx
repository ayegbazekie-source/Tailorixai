import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Share2, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { checkContent } from '@/lib/contentFilter';
import ModerationAlert from '@/components/feed/ModerationAlert';

export default function FeedShareModal({ imageUrl, garmentType, onClose, isPremium, currentUser }) {
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [moderationMsg, setModerationMsg] = useState(null);

  const cardBg = isPremium
    ? 'bg-[#111127] border border-indigo-500/20'
    : 'bg-white border border-slate-200';
  const titleColor = isPremium ? 'text-white' : 'text-slate-900';
  const subColor = isPremium ? 'text-indigo-300/70' : 'text-slate-500';
  const accentBtn = isPremium
    ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-900 font-bold'
    : 'bg-rose-500 hover:bg-rose-600 text-white';

  const handleShare = async () => {
    const textToCheck = caption || `Pattern layout for ${garmentType}`;
    const { blocked, reason } = checkContent(textToCheck);
    if (blocked) { setModerationMsg(reason); return; }
    setLoading(true);
    try {
      await base44.entities.InspirationPost.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name || 'Tailorix User',
        image_url: imageUrl,
        prompt: caption || `Pattern layout for ${garmentType}`,
        design_type: 'pattern',
        likes: 0,
        remix_count: 0,
        liked_by: [],
      });
      setDone(true);
      setTimeout(onClose, 1800);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <>
    <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className={`relative w-full max-w-md rounded-2xl p-6 ${cardBg} shadow-2xl`} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className={`font-bold text-lg ${titleColor}`}>Shared to Feed!</p>
            <p className={`text-sm mt-1 ${subColor}`}>Your pattern is now visible to the community.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Share2 className={`w-5 h-5 ${isPremium ? 'text-yellow-400' : 'text-rose-500'}`} />
              <h3 className={`font-bold text-base ${titleColor}`}>Share Pattern to Feed</h3>
            </div>

            <div className={`text-xs px-2.5 py-1.5 rounded-full inline-flex items-center gap-1 mb-4 font-semibold ${isPremium ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
              🧩 Pattern (Tailorix Deconstruct)
            </div>

            <img src={imageUrl} alt="Pattern preview" className="w-full max-h-48 object-contain rounded-xl mb-4 bg-slate-100" />

            <label className={`text-xs font-bold block mb-1.5 ${isPremium ? 'text-indigo-300' : 'text-slate-600'}`}>
              Add a caption <span className={`font-normal ${subColor}`}>(optional)</span>
            </label>
            <Textarea
              rows={3}
              placeholder={`e.g. "Pattern layout for a fitted peplum gown with princess seams"`}
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className={`text-sm resize-none mb-4 ${isPremium ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : ''}`}
            />

            <Button onClick={handleShare} disabled={loading} className={`w-full py-4 font-bold rounded-xl ${accentBtn}`}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sharing...</> : <><Share2 className="w-4 h-4 mr-2" />Share to Feed</>}
            </Button>
          </>
        )}
      </div>
    </div>

    <ModerationAlert message={moderationMsg} onClose={() => setModerationMsg(null)} />
    </>
  );
}