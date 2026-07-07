import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Scheduled cron: runs at 00:00 WAT (23:00 UTC previous day).
 *
 * WEB users    → Reset daily free credits to 2 + reset ad counter.
 * PLAYSTORE    → Reset ad counter only (monthly credits handled in checkAndResetCredits).
 * AMAZON users → Skipped entirely.
 * Premium      → Skipped.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Scheduled automations run without a user context — no auth header needed.
    // All DB operations use asServiceRole for admin-level access.

    const TIMEZONE = 'Africa/Lagos';
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());

    // Paginate through ALL users in batches to ensure no one is missed
    const BATCH_SIZE = 500;
    let skip = 0;
    let allUsers = [];
    while (true) {
      const batch = await base44.asServiceRole.entities.User.list('-created_date', BATCH_SIZE, skip);
      if (!batch || batch.length === 0) break;
      allUsers = allUsers.concat(batch);
      if (batch.length < BATCH_SIZE) break;
      skip += BATCH_SIZE;
    }

    let webReset = 0;
    let playReset = 0;
    let skipped = 0;

    for (const user of allUsers) {
      // Skip premium
      if (user.isPro || user.is_premium) { skipped++; continue; }

      // Skip Amazon
      const platform = user.platform || 'web';
      if (platform === 'amazon') { skipped++; continue; }

      const updates = {};
      const alreadyReset = user.last_credit_reset_date === todayStr;

      if (platform === 'web' && !alreadyReset) {
        updates.analysis_credits = 2;
        updates.illustrator_credits = 2;
        updates.solver_credits = 2;
        updates.visualizer_credits = 2;
        updates.last_credit_reset_date = todayStr;
        updates.rewarded_ads_watched_today = 0;
        updates.last_ad_reset_date = todayStr;
        webReset++;
      } else if (platform === 'playstore') {
        // Only reset ad counter daily
        const lastAdReset = user.last_ad_reset_date || null;
        if (lastAdReset !== todayStr && (user.rewarded_ads_watched_today || 0) > 0) {
          updates.rewarded_ads_watched_today = 0;
          updates.last_ad_reset_date = todayStr;
          playReset++;
        }
      }

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.User.update(user.id, updates);
      }
    }

    return Response.json({
      success: true,
      todayStr,
      totalUsers: allUsers.length,
      webReset,
      playReset,
      skipped,
      message: `Midnight reset complete: ${webReset} web, ${playReset} play, ${skipped} skipped (${allUsers.length} total users)`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
