import React, { useState } from 'react';
import { Lock, X, ZoomIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { resolveTemplate } from './PatternSVGTemplates';

// ── Full-screen modal ──────────────────────────────────────────────────────────
function ExpandModal({ piece, imageUrl, isLocked, isPremium, measurements, onClose }) {
  const accent = isPremium ? '#6366f1' : '#f43f5e';
  const gold = '#d4af37';

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl ${isPremium ? 'bg-[#0d0d20] border border-indigo-500/30' : 'bg-white border border-slate-200'}`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Large sketch */}
        <div className="relative bg-white flex items-center justify-center" style={{ minHeight: 320 }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={piece.name}
              className={`w-full object-contain max-h-[420px] ${isLocked ? 'blur-2xl' : ''}`}
            />
          ) : (
            <div className="w-full max-h-[360px] p-4 flex items-center justify-center">
              {resolveTemplate(piece.name, measurements, isPremium)}
            </div>
          )}
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm gap-3">
              <Lock className="w-10 h-10 text-yellow-400" />
              <p className="text-white font-semibold">Pro members only</p>
              <Link to={createPageUrl('Payment')}>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Details */}
        <div className={`p-6 ${isPremium ? 'text-white' : 'text-slate-800'}`}>
          <h3 className={`text-xl font-bold mb-3 ${isPremium ? 'text-white' : 'text-slate-900'}`}>{piece.name}</h3>
          {piece.shape_description && (
            <p className={`text-base mb-3 leading-relaxed ${isPremium ? 'text-indigo-200' : 'text-slate-600'}`}>
              {piece.shape_description || piece.shape}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {piece.seam_allowance && (
              <span className={`text-sm px-3 py-1 rounded-full font-mono border ${isPremium ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300' : 'border-rose-200 bg-rose-50 text-rose-600'}`}>
                SA: {piece.seam_allowance}
              </span>
            )}
            {piece.quantity && (
              <span className={`text-sm px-3 py-1 rounded-full border ${isPremium ? 'border-indigo-500/30 bg-indigo-900/30 text-indigo-200' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                Cut × {piece.quantity}
              </span>
            )}
          </div>
          {(piece.notes || piece.special_notes) && (
            <p className={`text-base leading-relaxed ${isPremium ? 'text-indigo-300' : 'text-slate-500'}`}>
              {piece.notes || piece.special_notes}
            </p>
          )}
          {piece.measurement_hint && (
            <p className={`mt-2 text-sm font-mono ${isPremium ? 'text-yellow-400' : 'text-rose-500'}`}>
              📏 {piece.measurement_hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export default function PatternPieceCard({ piece, imageUrl, isLocked, isPremium, measurements }) {
  const [expanded, setExpanded] = useState(false);
  const accent = isPremium ? 'border-indigo-500/40 bg-indigo-950/20' : 'border-slate-200 bg-white';
  const labelColor = isPremium ? 'text-indigo-100' : 'text-slate-900';
  const tagColor = isPremium ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-rose-500/10 text-rose-600 border-rose-200';
  const noteColor = isPremium ? 'text-indigo-300/70' : 'text-slate-500';
  const gold = '#d4af37';
  const accentStroke = isPremium ? '#6366f1' : '#f43f5e';

  return (
    <>
      {expanded && (
        <ExpandModal
          piece={piece}
          imageUrl={imageUrl}
          isLocked={isLocked}
          isPremium={isPremium}
          measurements={measurements}
          onClose={() => setExpanded(false)}
        />
      )}

      <div
        className={`relative rounded-2xl border p-3 flex flex-col gap-2 cursor-pointer hover:scale-[1.02] transition-transform ${accent}`}
        onClick={() => setExpanded(true)}
      >
        {/* Zoom hint */}
        <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${isPremium ? 'bg-indigo-900/60' : 'bg-slate-100'}`}>
          <ZoomIn className={`w-3 h-3 ${isPremium ? 'text-indigo-300' : 'text-slate-500'}`} />
        </div>

        {/* Sketch area */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-white flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={piece.name}
              className={`w-full h-full object-contain transition-all duration-300 ${isLocked ? 'blur-xl scale-105' : ''}`}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center p-1 ${isLocked ? 'blur-md' : ''}`}>
              {resolveTemplate(piece.name, measurements, isPremium)}
            </div>
          )}

          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl gap-1">
              <Lock className="w-5 h-5 text-yellow-400" />
              <span className="text-[10px] text-yellow-300 font-semibold">Pro Only</span>
            </div>
          )}
        </div>

        {/* Labels */}
        <p className={`text-sm font-bold truncate ${labelColor}`}>{piece.name}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {piece.seam_allowance && (
            <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${tagColor}`}>
              SA: {piece.seam_allowance}
            </span>
          )}
          {piece.measurement_hint && (
            <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${isPremium ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
              {piece.measurement_hint}
            </span>
          )}
          {piece.quantity && (
            <span className={`text-xs px-1.5 py-0.5 rounded border ${isPremium ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
              ×{piece.quantity}
            </span>
          )}
        </div>

        {/* Notes */}
        {(piece.notes || piece.special_notes) && (
          <p className={`text-xs leading-relaxed line-clamp-2 ${noteColor}`}>{piece.notes || piece.special_notes}</p>
        )}
      </div>
    </>
  );
}