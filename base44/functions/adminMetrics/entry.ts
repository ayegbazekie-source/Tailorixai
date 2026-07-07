import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Admin-only: returns platform health metrics aggregated from User, SewingSession, GeneratedDesigns entities.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all users in batches
    const BATCH = 500;
    let allUsers = [];
    let skip = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.User.list('-created_date', BATCH, skip);
      if (!batch || batch.length === 0) break;
      allUsers = allUsers.concat(batch);
      if (batch.length < BATCH) break;
      skip += BATCH;
    }

    // Fetch recent designs (last 500) for activity signals
    const designs = await base44.asServiceRole.entities.GeneratedDesigns.list('-created_date', 500);

    const now = new Date();

    // Helper: get date string YYYY-MM-DD for a Date offset by N days ago
    const dateStr = (daysAgo) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    // Build last-14-days buckets
    const days = Array.from({ length: 14 }, (_, i) => dateStr(13 - i));

    // DAU: users whose last_credit_reset_date falls on a given day (proxy for active day)
    const dauByDay = {};
    days.forEach(d => dauByDay[d] = 0);
    allUsers.forEach(u => {
      const d = u.last_credit_reset_date;
      if (d && dauByDay[d] !== undefined) dauByDay[d]++;
    });

    // New signups per day
    const signupsByDay = {};
    days.forEach(d => signupsByDay[d] = 0);
    allUsers.forEach(u => {
      const d = u.created_date ? u.created_date.split('T')[0] : null;
      if (d && signupsByDay[d] !== undefined) signupsByDay[d]++;
    });

    // Designs generated per day
    const designsByDay = {};
    days.forEach(d => designsByDay[d] = 0);
    designs.forEach(des => {
      const d = des.created_date ? des.created_date.split('T')[0] : null;
      if (d && designsByDay[d] !== undefined) designsByDay[d]++;
    });

    // Summary stats
    const totalUsers = allUsers.length;
    const premiumUsers = allUsers.filter(u => u.isPro || u.is_premium).length;
    const freeUsers = totalUsers - premiumUsers;
    const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0.0';

    // Platform breakdown
    const platformCounts = { web: 0, playstore: 0, amazon: 0, unknown: 0 };
    allUsers.forEach(u => {
      const p = u.platform || 'web';
      if (platformCounts[p] !== undefined) platformCounts[p]++;
      else platformCounts.unknown++;
    });

    // Total credits consumed today (approx: users who had reset today consumed their daily allocation)
    const today = dateStr(0);
    const activeToday = allUsers.filter(u => u.last_credit_reset_date === today).length;

    // Build chart data array
    const dailyTrend = days.map(d => ({
      date: d.slice(5), // MM-DD
      dau: dauByDay[d],
      signups: signupsByDay[d],
      designs: designsByDay[d],
    }));

    return Response.json({
      summary: {
        totalUsers,
        premiumUsers,
        freeUsers,
        conversionRate: parseFloat(conversionRate),
        activeToday,
        totalDesigns: designs.length,
        platformCounts,
      },
      dailyTrend,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
