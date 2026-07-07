import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { usePremium } from '@/components/PremiumProvider';
import { PLATFORM, IS_AMAZON } from '@/lib/platform';

const CREDIT_FIELD_MAP = {
  analysis: 'analysis_credits',
  illustrator: 'illustrator_credits',
  solver: 'solver_credits',
  visualizer: 'visualizer_credits'
};

export function useCreditSystem(featureType) {
  const { user, isPremiumActive } = usePremium();
  const [credits, setCredits] = useState(null);
  const [dailyAdsWatched, setDailyAdsWatched] = useState(0);
  const [loading, setLoading] = useState(true);

  const creditField = CREDIT_FIELD_MAP[featureType];

  const CACHE_KEY = `credits_cache_${user?.id}`;
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  const refresh = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    // Premium users (all platforms): unlimited, skip backend call
    if (isPremiumActive) {
      setCredits(Infinity);
      setDailyAdsWatched(0);
      setLoading(false);
      return;
    }

    // Check sessionStorage cache first — avoid re-calling backend on tab switches
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL_MS) {
            const rawValue = data?.credits?.[featureType];
            setCredits(rawValue === 'unlimited' || rawValue === 'trial' ? Infinity : (rawValue ?? 0));
            setDailyAdsWatched(data?.adsWatchedToday ?? 0);
            setLoading(false);
            return;
          }
        }
      } catch (_) {}
    }

    // Free users: fetch real credit count from backend
    try {
      const result = await base44.functions.invoke('checkAndResetCredits', { platform: PLATFORM });
      const backendCredits = result.data?.credits;
      const rawValue = backendCredits?.[featureType];
      setCredits(rawValue === 'unlimited' || rawValue === 'trial' ? Infinity : (rawValue ?? 0));
      setDailyAdsWatched(result.data?.adsWatchedToday ?? 0);
      // Cache the result
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: result.data, timestamp: Date.now() }));
      } catch (_) {}
    } catch (e) {
      console.error('Credit system error:', e);
    }
    setLoading(false);
  }, [user, isPremiumActive, featureType, CACHE_KEY]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Amazon: no ads — just credit count from backend (trial=Infinity, post-trial=2/day)
  const dailyLimitReached = !isPremiumActive && !IS_AMAZON && credits === 0 && dailyAdsWatched >= 5;
  const showWatchAd = !isPremiumActive && !IS_AMAZON && credits === 0 && dailyAdsWatched < 5;
  const showGoPremium = dailyLimitReached || (IS_AMAZON && credits === 0);
  const hasCredits = isPremiumActive || (credits !== null && credits > 0);

  const invalidateCache = () => {
    try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
  };

  const handleAdReward = async () => {
    if (IS_AMAZON) return { success: false, error: 'Access Denied' };
    const result = await base44.functions.invoke('rewardUserWithCredit', {
      feature_type: featureType,
      platform: PLATFORM
    });
    if (result.data?.success) {
      setCredits(result.data.newCredits);
      setDailyAdsWatched(result.data.adsWatchedToday);
      invalidateCache();
    }
    return result.data;
  };

  const deductCredit = async () => {
    if (isPremiumActive) return { success: true, isPremium: true };
    const result = await base44.functions.invoke('deductCredit', { feature_type: featureType });
    if (result.data?.success) {
      setCredits(result.data.remainingCredits);
      invalidateCache();
    }
    return result.data;
  };

  return {
    credits,
    dailyAdsWatched,
    loading,
    showWatchAd,
    showGoPremium,
    dailyLimitReached,
    hasCredits,
    handleAdReward,
    deductCredit,
    refresh,
    isPremium: isPremiumActive,
    platform: PLATFORM,
    isAmazon: IS_AMAZON
  };
}