import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import {
  Sparkles, Camera, Wand2, HelpCircle, Shirt, ArrowRight,
  Lock, Star, Zap, Trophy, X, LogIn, Scissors, Users, Globe } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';

// ─── Login Modal ──────────────────────────────────────────────────────────────
function LoginModal({ isOpen, onClose }) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}>
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}>
          
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Unlock Full Access</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Create a free account to start using AI-powered tailoring tools instantly.
            </p>
          </div>

          <div className="flex items-start gap-3 mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <Checkbox
              id="modal-terms"
              checked={agreed}
              onCheckedChange={setAgreed}
              className="border-slate-400 mt-0.5" />
            
            <label htmlFor="modal-terms" className="text-sm text-slate-600 cursor-pointer leading-relaxed">
              I agree to the{' '}
              <a href="https://sites.google.com/view/tailorix-ai-legal" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-rose-400 hover:text-rose-300 underline font-medium">
                Terms of Service
              </a>
            </label>
          </div>

          <Button
            size="lg"
            disabled={!agreed}
            onClick={() => base44.auth.redirectToLogin(createPageUrl('Home'))}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-2xl py-6 text-base font-semibold shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed mb-3">
            
            <Sparkles className="w-4 h-4 mr-2" />
            Sign Up Free
          </Button>

          <Button
            size="lg"
            variant="outline"
            disabled={!agreed}
            onClick={() => base44.auth.redirectToLogin(createPageUrl('Home'))}
            className="w-full border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed">
            
            <LogIn className="w-4 h-4 mr-2" />
            Log In
          </Button>
          {!agreed &&
          <p className="text-center text-xs text-amber-400 mt-2">
              Please agree to the Terms of Service to continue
            </p>
          }
        </motion.div>
      </motion.div>
    </AnimatePresence>);

}

// ─── Locked Feature Card ──────────────────────────────────────────────────────
function LockedFeatureCard({ icon: Icon, iconUrl, title, description, color, badge, onLockClick }) {
  const colors = {
    rose: 'bg-rose-100 text-rose-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600'
  };

  return (
    <div
      onClick={onLockClick}
      className="bg-white rounded-xl p-3 border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer h-full relative group hover:-translate-y-1 shadow-sm">
      
      {badge &&
      <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
      badge === 'Free' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`
      }>
          {badge}
        </span>
      }
      <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center mb-2`}>
        {iconUrl ?
        <img src={iconUrl} alt={title} className="w-5 h-5 object-contain" /> :

        <Icon className="w-4 h-4" />
        }
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
        {title}
        <Lock className="w-3 h-3 text-slate-400 group-hover:text-rose-500 transition-colors" />
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>);

}

// ─── Main GuestShowroom Page ──────────────────────────────────────────────────
export default function GuestShowroom() {
  const [showModal, setShowModal] = useState(false);

  const triggerLogin = () => setShowModal(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50">
      <LoginModal isOpen={showModal} onClose={() => setShowModal(false)} />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697d0c21476d1c06f4d428ff/d87b8f481_TailorixAi.png"
              alt="Tailorix AI"
              className="w-9 h-9 rounded-xl object-cover" />
            
            <span className="text-lg font-semibold text-slate-900">Tailorix AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={triggerLogin} className="text-slate-600 hover:text-slate-900 text-sm">
              Log In
            </Button>
            <Button onClick={triggerLogin} className="bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-xl shadow-lg shadow-rose-500/20">
              Sign Up Free
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero Banner ── */}
      <div className="pt-28 pb-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 rounded-full text-rose-400 text-sm font-medium mb-6 border border-rose-500/20">
              <Sparkles className="w-4 h-4" />
              AI-Powered Tailoring Intelligence
            </div>

            <h1 className="text-4xl md:text-6xl font-light text-slate-900 tracking-tight mb-5">
              The Smartest <br />
              <span className="font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                Tailoring Assistant
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
              Analyze garments, generate fashion illustrations, visualize fabrics, and solve fitting challenges — powered by advanced AI, built for tailors.
            </p>

            {/* Primary CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center">
              
              <Button
                size="lg"
                onClick={triggerLogin}
                className="bg-rose-500 hover:bg-rose-600 text-white px-10 py-7 text-xl rounded-2xl shadow-2xl shadow-rose-500/30 hover:shadow-rose-500/50 transition-all hover:-translate-y-1 font-semibold">
                
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={triggerLogin}
                className="border-2 border-slate-600 hover:border-slate-400 text-white px-8 py-7 text-xl rounded-2xl bg-[hsl(var(--foreground))]">
                
                <LogIn className="w-5 h-5 mr-2" />
                Log In
              </Button>
            </motion.div>

            <p className="text-slate-500 text-sm mt-4">Free to start — no credit card required</p>
          </motion.div>
        </div>
      </div>

      {/* ── Teased App UI ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8">
          
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Everything You Need, All In One Place</h2>
          <p className="text-slate-500 text-sm">Sign up to unlock all tools instantly</p>
        </motion.div>

        {/* Glass-overlaid App Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative rounded-3xl overflow-hidden border border-slate-700/60">
          
          {/* Fake App Shell */}
          <div className="bg-white/90 p-6 border border-slate-200 rounded-3xl">
            {/* Fake top bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-100 rounded-lg" />
                <div className="h-4 w-32 bg-slate-200 rounded-full" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-slate-200 rounded-lg" />
                <div className="h-8 w-24 bg-rose-100 rounded-lg" />
              </div>
            </div>

            {/* Feature Cards Grid — locked */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <LockedFeatureCard
                icon={Camera}
                title="Garment Analysis"
                description="3-tab AI-powered analysis — fitting issues, seam quality & general overview"
                color="rose"
                onLockClick={triggerLogin} />
              
              <LockedFeatureCard
                icon={Wand2}
                title="Fashion Illustrator"
                description="Generate, modify & convert garment designs with AI illustrations"
                color="violet"
                onLockClick={triggerLogin} />
              
              <LockedFeatureCard
                icon={Scissors}
                title="Garment Deconstruct"
                description="Upload any garment → get a CAD illustration + full pattern layout board"
                color="amber"
                onLockClick={triggerLogin} />
              
              <LockedFeatureCard
                iconUrl="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697d0c21476d1c06f4d428ff/169a0ecf8_TailorixChat.png"
                title="Tailorix AI Chat"
                description="Ask any tailoring question and get instant expert answers"
                color="emerald"
                badge="Free"
                onLockClick={triggerLogin} />
              
              <LockedFeatureCard
                icon={Shirt}
                title="Fabric Visualizer"
                description="Preview your fabric on garment styles before cutting a thread"
                color="blue"
                onLockClick={triggerLogin} />
              
              <LockedFeatureCard
                icon={Star}
                title="Inspiration Feed"
                description="Browse, remix & share AI-generated community designs"
                color="rose"
                onLockClick={triggerLogin} />
              
            </div>

            {/* Fake action buttons row */}
            <div className="mt-6 flex gap-3 flex-wrap">
              {['Analyze Garment', 'Generate Design', 'Deconstruct Garment', 'Visualize Fabric'].map((label) =>
              <button
                key={label}
                onClick={triggerLogin}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-sm text-slate-600 hover:text-rose-600 transition-all">
                
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  {label}
                </button>
              )}
            </div>
          </div>

          {/* Glass overlay covering the canvas area */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent flex flex-col items-center justify-end pb-10 pointer-events-none">
            <div className="text-center px-4">
              <Lock className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <p className="text-slate-900 font-semibold text-lg mb-1">Sign up to start designing</p>
              <p className="text-slate-500 text-sm">Free account — 2 credits daily, no card needed</p>
            </div>
          </div>

          {/* Clickable overlay to trigger modal */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={triggerLogin} />
          
        </motion.div>

        {/* ── Why Tailorix? Team Collaboration Teaser ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-16">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-full text-indigo-400 text-sm font-medium mb-4 border border-indigo-500/20">
              <Users className="w-4 h-4" />
              Team Collaboration — Pro Feature
            </div>
            <h2 className="text-3xl font-semibold text-slate-900 mb-3">Why Tailorix?</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
              A Lead Designer in Lagos can deconstruct a garment and hand it off to a Tailor in Abuja — in real-time, with zero file sharing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
            { icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', title: 'Global Workshop', desc: 'Your team works from anywhere. Designs sync instantly across all collaborators.' },
            { icon: Scissors, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', title: 'Role-Based Access', desc: 'Supervisors design. Tailors deconstruct. Each role sees exactly what they need — nothing more.' },
            { icon: Sparkles, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', title: 'AI Handover', desc: 'Click a workspace design to instantly open it in the Illustrator or send it to Deconstruct for a Tailor.' }].
            map((item, i) =>
            <div key={i} className={`rounded-2xl p-6 border ${item.bg} bg-white shadow-sm`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${item.bg}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="text-slate-900 font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="text-center bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl p-10 border border-indigo-200">
            <Users className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Bring your workshop into the 21st Century.</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">Start a Team, assign roles, and collaborate on garment designs with AI-powered precision.</p>
            <Button
              onClick={triggerLogin}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white px-10 py-5 text-lg rounded-2xl shadow-xl shadow-indigo-500/20 font-semibold">
              
              <Users className="w-5 h-5 mr-2" />
              Start a Team
            </Button>
          </div>
        </motion.div>

        {/* ── Stats / Social Proof ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center">
          
          <Trophy className="w-10 h-10 text-rose-500 mx-auto mb-4" />
          <h2 className="text-3xl font-semibold text-slate-900 mb-3">Trusted by Tailors Worldwide</h2>
          <p className="text-slate-500 max-w-xl mx-auto mb-8 text-sm leading-relaxed">
            From beginners learning their first stitch to master tailors running professional shops —
            Tailorix AI provides intelligent assistance at every skill level.
          </p>
          <div className="flex justify-center gap-10 flex-wrap mb-8">
            {[['10K+', 'Active Users'], ['50K+', 'Designs Generated'], ['98%', 'Success Rate']].map(([val, label]) =>
            <div key={label} className="text-center">
                <div className="text-3xl font-bold text-slate-900">{val}</div>
                <div className="text-sm text-slate-500 mt-1">{label}</div>
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <Button
            size="lg"
            onClick={triggerLogin}
            className="bg-rose-500 hover:bg-rose-600 text-white px-10 py-6 text-lg rounded-2xl shadow-xl shadow-rose-500/20 hover:shadow-rose-500/40 transition-all hover:-translate-y-0.5 font-semibold">
            
            <Zap className="w-5 h-5 mr-2" />
            Join Free Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center">
        <a href="https://sites.google.com/view/tailorix-ai-legal" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-700 text-sm">
          Terms & Privacy Policy
        </a>
        <p className="text-slate-400 text-sm mt-3">© 2026 Tailorix AI. All rights reserved.</p>
      </footer>
    </div>);

}