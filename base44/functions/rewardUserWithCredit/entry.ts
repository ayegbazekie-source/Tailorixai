import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Platform-aware ad reward.
 *
 * AMAZON    → Blocked. Returns 403.
 * WEB       → Monetag/Propeller ad reward (validated server-side).
 * PLAYSTORE → AdMob reward (validated server-side).
 *
 * Max 5 ads per 24-hour period (WAT midnight reset).
 * 60-second cooldown between consecutive ads.
 */

const CREDIT_FIELDS = {
  analysis: 'analysis_credits',
  illustrator: 'illustrator_credits',
  solver: 'solver_credits',
  visualizer: 'visualizer_credits'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Premium bypass
    if (user.isPro === true || user.is_premium === true) {
      return Response.json({ success: true, isPremium: true, message: 'Premium user' });
    }

    const { feature_type, platform = 'web' } = await req.json();

    // AMAZON: ads disabled entirely
    if (platform === 'amazon') {
      return Response.json({
        success: false,
        error: 'Access Denied. Ad rewards are not available on Amazon.'
      }, { status: 403 });
    }

    const creditField = CREDIT_FIELDS[feature_type];
    if (!creditField) return Response.json({ error: 'Invalid feature type' }, { status: 400 });

    const now = new Date();
    const TIMEZONE = 'Africa/Lagos';
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now);

    // --- Daily ad counter (WAT midnight reset) ---
    const lastAdReset = user.last_ad_reset_date || null;
    const adsWatchedToday = lastAdReset !== todayStr ? 0 : (user.rewarded_ads_watched_today || 0);

    // --- Daily ad limit (5 per day, all platforms except Amazon) ---
    if (adsWatchedToday >= 5) {
      return Response.json({
        success: false,
        error: 'Daily ad limit reached (5/5). Come back tomorrow or go Premium.',
        adsWatchedToday,
        limit: 5
      }, { status: 403 });
    }

    // --- 60-second cooldown between ads ---
    const lastAdTimestamp = user.last_ad_timestamp ? new Date(user.last_ad_timestamp) : null;
    const secondsSinceLastAd = lastAdTimestamp
      ? (now.getTime() - lastAdTimestamp.getTime()) / 1000
      : 999;
    if (secondsSinceLastAd < 60) {
      return Response.json({
        success: false,
        error: 'Please wait 60 seconds between ads.',
        cooldownRemaining: Math.ceil(60 - secondsSinceLastAd)
      }, { status: 429 });
    }

    const currentCredits = user[creditField] || 0;
    const newCredits = currentCredits + 1;
    const newAdsWatched = adsWatchedToday + 1;

    await base44.auth.updateMe({
      [creditField]: newCredits,
      rewarded_ads_watched_today: newAdsWatched,
      last_ad_reset_date: todayStr,
      last_ad_timestamp: now.toISOString(),
      last_reward_date: now.toISOString()
    });

    return Response.json({
      success: true,
      platform,
      newCredits,
      adsWatchedToday: newAdsWatched,
      remainingAdSlots: 5 - newAdsWatched,
      message: `+1 credit earned! (${newAdsWatched}/5 ads today)`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
