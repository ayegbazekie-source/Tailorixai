import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Platform-aware credit check & reset.
 *
 * AMAZON  → No credit logic. Returns trial status only.
 * WEB     → 2 free credits daily (midnight WAT). Ad counter resets daily.
 * PLAYSTORE → 3 free credits every 30 days from sign-up. Ad counter resets daily.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Premium users always get unlimited
    let isPremium = user.isPro === true || user.is_premium === true;
    if (isPremium && user.premium_expiry_date) {
      if (new Date() > new Date(user.premium_expiry_date)) {
        isPremium = false;
        await base44.auth.updateMe({ is_premium: false });
      }
    }
    if (isPremium) {
      return Response.json({
        message: 'Premium user - unlimited access',
        credits: { analysis: 'unlimited', illustrator: 'unlimited', solver: 'unlimited', visualizer: 'unlimited' }
      });
    }

    // Read platform from request body (sent by useCreditSystem)
    let platform = 'web';
    try {
      const body = await req.json();
      platform = body?.platform || 'web';
    } catch (_) {}

    // AMAZON: 7-day free trial from subscription start, then 2 free credits/day (no ads)
    if (platform === 'amazon') {
      const trialStart = user.amazon_trial_start ? new Date(user.amazon_trial_start) : null;
      const TRIAL_DAYS = 7;
      const trialActive = trialStart
        ? (Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24) < TRIAL_DAYS
        : false;

      if (trialActive) {
        // Still within free trial — unlimited
        return Response.json({
          platform: 'amazon',
          trialActive: true,
          message: 'Amazon free trial active',
          credits: { analysis: 'trial', illustrator: 'trial', solver: 'trial', visualizer: 'trial' },
          adsWatchedToday: 0
        });
      }

      // Trial over — 2 free credits per day (no ads on Amazon)
      const TIMEZONE = 'Africa/Lagos';
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
      const lastResetDate = user.last_credit_reset_date || null;
      const amazonUpdates = {};

      if (lastResetDate !== todayStr) {
        const FREE_DAILY = 2;
        amazonUpdates.analysis_credits = FREE_DAILY;
        amazonUpdates.illustrator_credits = FREE_DAILY;
        amazonUpdates.solver_credits = FREE_DAILY;
        amazonUpdates.visualizer_credits = FREE_DAILY;
        amazonUpdates.last_credit_reset_date = todayStr;
        await base44.auth.updateMe(amazonUpdates);
      }

      const freshUser = await base44.auth.me();
      return Response.json({
        platform: 'amazon',
        trialActive: false,
        message: 'Amazon trial ended - 2 free credits per day',
        adsWatchedToday: 0,
        credits: {
          analysis: freshUser.analysis_credits ?? 0,
          illustrator: freshUser.illustrator_credits ?? 0,
          solver: freshUser.solver_credits ?? 0,
          visualizer: freshUser.visualizer_credits ?? 0
        }
      });
    }

    const TIMEZONE = 'Africa/Lagos';
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
    const now = new Date();
    const updates = {};
    let creditsReset = false;
    let adsReset = false;
    let dailyGranted = false;

    // ── WEB: 2 free credits daily ────────────────────────────────────────────
    if (platform === 'web') {
      const lastResetDate = user.last_credit_reset_date || null;
      if (lastResetDate !== todayStr) {
        const FREE_DAILY = 2;
        updates.analysis_credits = FREE_DAILY;
        updates.illustrator_credits = FREE_DAILY;
        updates.solver_credits = FREE_DAILY;
        updates.visualizer_credits = FREE_DAILY;
        updates.last_credit_reset_date = todayStr;
        creditsReset = true;
        dailyGranted = true;
      }

      // Daily ad counter reset at midnight WAT
      const lastAdReset = user.last_ad_reset_date || null;
      if (lastAdReset !== todayStr && (user.rewarded_ads_watched_today || 0) > 0) {
        updates.rewarded_ads_watched_today = 0;
        updates.last_ad_reset_date = todayStr;
        adsReset = true;
      }
    }

    // ── PLAYSTORE: 3 free credits every 30 days + daily ad reset ─────────────
    if (platform === 'playstore') {
      const signUpDate = user.created_date ? new Date(user.created_date) : now;
      const lastMonthlyReset = user.last_monthly_credit_reset ? new Date(user.last_monthly_credit_reset) : null;
      const daysSinceReset = lastMonthlyReset
        ? (now.getTime() - lastMonthlyReset.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (daysSinceReset >= 30) {
        const FREE_MONTHLY = 3;
        updates.analysis_credits = (user.analysis_credits || 0) + FREE_MONTHLY;
        updates.illustrator_credits = (user.illustrator_credits || 0) + FREE_MONTHLY;
        updates.solver_credits = (user.solver_credits || 0) + FREE_MONTHLY;
        updates.visualizer_credits = (user.visualizer_credits || 0) + FREE_MONTHLY;
        updates.last_monthly_credit_reset = now.toISOString();
        creditsReset = true;
        dailyGranted = true;
      }

      // Daily ad counter reset at midnight WAT
      const lastAdReset = user.last_ad_reset_date || null;
      if (lastAdReset !== todayStr && (user.rewarded_ads_watched_today || 0) > 0) {
        updates.rewarded_ads_watched_today = 0;
        updates.last_ad_reset_date = todayStr;
        adsReset = true;
      }
    }

    if (Object.keys(updates).length > 0) {
      await base44.auth.updateMe(updates);
    }

    const freshUser = await base44.auth.me();
    const lastAdReset = freshUser.last_ad_reset_date || null;
    const currentDailyAds = lastAdReset !== todayStr ? 0 : (freshUser.rewarded_ads_watched_today || 0);

    return Response.json({
      platform,
      message: dailyGranted ? 'Credits granted' : 'Credits checked',
      creditsReset,
      dailyGranted,
      adsReset,
      adsWatchedToday: currentDailyAds,
      credits: {
        analysis: freshUser.analysis_credits ?? 0,
        illustrator: freshUser.illustrator_credits ?? 0,
        solver: freshUser.solver_credits ?? 0,
        visualizer: freshUser.visualizer_credits ?? 0
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});