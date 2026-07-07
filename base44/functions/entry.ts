import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all notifications
    const all = await base44.asServiceRole.entities.Notification.list('-created_date', 200);

    // Filter old ones
    const stale = all.filter(n => n.created_date < thirtyDaysAgo);

    // Delete each stale notification
    await Promise.all(stale.map(n => base44.asServiceRole.entities.Notification.delete(n.id)));

    return Response.json({ deleted: stale.length, message: `Removed ${stale.length} old notifications.` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});