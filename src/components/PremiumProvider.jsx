import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import AmazonIAPHandler from '@/components/AmazonIAPHandler';

const PremiumContext = createContext(null);

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
};

export default function PremiumProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremiumActive, setIsPremiumActive] = useState(false);

  useEffect(() => {
    loadUserState();
  }, []);

  const loadUserState = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      // SINGLE SOURCE OF TRUTH: isPro field
      const premiumActive = currentUser.isPro === true;
      
      setUser(currentUser);
      setIsPremiumActive(premiumActive);
      
      // FORCE apply premium theme IMMEDIATELY — premium is ALWAYS dark
      if (premiumActive) {
        document.documentElement.classList.add('pro-mode', 'dark');
        document.documentElement.classList.remove('free-mode');
        document.body.setAttribute('data-premium', 'true');
        // Permanently override any stored theme preference
        localStorage.setItem('theme', 'dark');
      } else {
        // Free users are ALWAYS light mode — no exceptions
        localStorage.setItem('theme', 'light');
        document.documentElement.classList.remove('pro-mode', 'dark');
        document.documentElement.classList.add('free-mode');
        document.documentElement.style.backgroundColor = '#efefef';
        document.documentElement.style.colorScheme = 'light';
        document.body.setAttribute('data-premium', 'false');
      }
      
      // Store in global window object for immediate access
      window.__PREMIUM_ACTIVE__ = premiumActive;
      window.__CURRENT_USER__ = currentUser;

      // Store premium flag globally for ad gate checks
      window.__PREMIUM_ACTIVE__ = premiumActive;
      
    } catch (error) {
      console.error('Failed to load user:', error);
      // User not logged in
      setUser(null);
      setIsPremiumActive(false);
      document.documentElement.classList.remove('pro-mode');
      window.__PREMIUM_ACTIVE__ = false;
    }
    
    setLoading(false);
  };

  const refreshPremiumStatus = async () => {
    await loadUserState();
  };

  if (loading) {
    // BLOCK ALL UI RENDERING - Show only loading screen
    return (
      <div className="fixed inset-0 bg-[#efefef] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Tailorix AI</h2>
          <p className="text-slate-500">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <PremiumContext.Provider value={{ user, isPremiumActive, refreshPremiumStatus }}>
      <AmazonIAPHandler onPurchaseSuccess={refreshPremiumStatus} />
      {children}
    </PremiumContext.Provider>
  );
}