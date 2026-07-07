import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });

    const body = await req.json();
    const isProduction = body.is_production === true;

    // Upsert the AppConfig record for is_production
    const existing = await base44.asServiceRole.entities.AppConfig.filter({ key: 'is_production' });

    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.AppConfig.update(existing[0].id, {
        value: isProduction ? 'true' : 'false'
      });
    } else {
      await base44.asServiceRole.entities.AppConfig.create({
        key: 'is_production',
        value: isProduction ? 'true' : 'false',
        description: 'Controls whether the app uses live AdMob / Google Play Billing (true) or test mode (false)'
      });
    }

    return Response.json({ success: true, is_production: isProduction });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});