import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check, MessageCircle } from 'lucide-react';

const TAILORIX_LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697d0c21476d1c06f4d428ff/d87b8f481_TailorixAi.png';

// Build share text
function buildShareText(post) {
  const type = post?.design_type === 'pattern' ? '🧵 Pattern' : '✨ AI Illustration';
  const prompt = post?.prompt ? `"${post.prompt.slice(0, 80)}${post.prompt.length > 80 ? '…' : ''}"` : '';
  return `${type} on Tailorix AI\n${prompt}\n\nCreate your own → tailorix.ai`;
}

export default function ShareMenu({ post, imageUrl, onClose, isPremiumActive }) {
  const [copied, setCopied] = useState(false);
  const [nativeShareDone, setNativeShareDone] = useState(false);

  const shareText = buildShareText(post);
  const shareUrl = window.location.href;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const bgCls = isPremiumActive ? 'bg-[#1a1a2e] border-slate-700' : 'bg-white border-slate-200';
  const overlayItem = isPremiumActive ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700';
  const titleCls = isPremiumActive ? 'text-white' : 'text-slate-900';
  const subCls = isPremiumActive ? 'text-slate-400' : 'text-slate-500';

  // Native Share Sheet (iOS/Android PWA)
  const handleNativeShare = async () => {
    if (!navigator.share) return false;
    try {
      // Try to share with image blob
      let shareData = { title: 'Tailorix AI Design', text: shareText, url: shareUrl };
      if (imageUrl) {
        try {
          const resp = await fetch(imageUrl);
          const blob = await resp.blob();
          const file = new File([blob], 'tailorix-design.jpg', { type: blob.type });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData = { title: 'Tailorix AI Design', text: shareText, files: [file] };
          }
        } catch (_) { /* fallback to text-only share */ }
      }
      await navigator.share(shareData);
      setNativeShareDone(true);
      setTimeout(onClose, 800);
    } catch (_) { /* user cancelled */ }
    return true;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const channels = [
    {
      label: 'WhatsApp',
      color: 'bg-[#25D366]',
      textColor: 'text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      ),
      href: `https://wa.me/?text=${encodedText}%0A${encodedUrl}`,
    },
    {
      label: 'Facebook',
      color: 'bg-[#1877F2]',
      textColor: 'text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    },
    {
      label: 'Instagram',
      color: 'bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]',
      textColor: 'text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
      ),
      // Instagram doesn't support direct URL sharing — open profile/story intent
      href: `https://www.instagram.com/`,
      note: 'Copy & paste in story',
    },
    {
      label: 'Telegram',
      color: 'bg-[#229ED9]',
      textColor: 'text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      ),
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      label: 'X (Twitter)',
      color: 'bg-black',
      textColor: 'text-white',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      ),
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
  ];

  const supportsNativeShare = !!navigator.share;

  return (
    <div className="fixed inset-0 z-[600] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={`relative w-full max-w-sm rounded-t-3xl md:rounded-2xl border shadow-2xl p-5 ${bgCls}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className={`w-10 h-1 rounded-full mx-auto mb-4 md:hidden ${isPremiumActive ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-bold text-base ${titleCls}`}>Share Design</h3>
            <p className={`text-xs mt-0.5 ${subCls}`}>Send to your favourite app</p>
          </div>
          <button onClick={onClose} className={`w-7 h-7 rounded-full flex items-center justify-center ${isPremiumActive ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image preview + logo */}
        {imageUrl && (
          <div className="relative mb-4 rounded-xl overflow-hidden h-28 bg-black flex items-center justify-center">
            <img src={imageUrl} alt="Share preview" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <img src={TAILORIX_LOGO} alt="Tailorix" className="w-5 h-5 rounded-md" />
              <span className="text-white text-[10px] font-bold tracking-wide">TAILORIX AI</span>
            </div>
          </div>
        )}

        {/* Channel icons */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {channels.map(ch => (
            <a
              key={ch.label}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 group"
              onClick={e => { if (ch.note) { e.preventDefault(); handleCopy(); } }}
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${ch.color}`}>
                {ch.icon}
              </div>
              <span className={`text-[9px] font-medium text-center leading-tight ${subCls}`}>{ch.label}</span>
            </a>
          ))}
        </div>

        <div className={`border-t pt-3 flex flex-col gap-2 ${isPremiumActive ? 'border-slate-700' : 'border-slate-100'}`}>
          {/* Copy Link */}
          <button
            onClick={handleCopy}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${overlayItem}`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Link Copied!' : 'Copy Link'}
          </button>

          {/* Native System Share */}
          {supportsNativeShare && (
            <button
              onClick={handleNativeShare}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${overlayItem}`}
            >
              {nativeShareDone ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              {nativeShareDone ? 'Shared!' : 'More Apps (System Share)'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}