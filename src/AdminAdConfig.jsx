import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Radio } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAdConfig() {
  const [config, setConfig] = useState({
    provider: 'monetag',
    adEnabled: true,
    monetagScript: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getWebAdConfig', {});
      if (res.data) setConfig(res.data);
    } catch {
      toast.error('Failed to load ad config');
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('saveWebAdConfig', config);
      if (res.data?.success) {
        toast.success('Ad configuration saved!');
      } else {
        toast.error('Failed to save config');
      }
    } catch {
      toast.error('Failed to save config');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading ad config...
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Radio className="w-4 h-4 text-blue-400" />
        <span className="text-white font-semibold text-sm">Web Ad System</span>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-white text-sm">Ads Enabled</Label>
          <p className="text-slate-400 text-xs">Turn off to use simulation mode</p>
        </div>
        <Switch
          checked={config.adEnabled}
          onCheckedChange={(val) => setConfig({ ...config, adEnabled: val })}
        />
      </div>

      {/* Provider selector */}
      <div>
        <Label className="text-white text-sm mb-2 block">Ad Provider</Label>
        <Select value={config.provider} onValueChange={(val) => setConfig({ ...config, provider: val })}>
          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monetag">Monetag</SelectItem>
            <SelectItem value="disabled">Disabled (Simulate)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Monetag MultiTag Global Script */}
      {config.provider === 'monetag' && (
        <div>
          <Label className="text-white text-sm mb-1 block">Monetag Global Script (MultiTag)</Label>
          <p className="text-slate-400 text-xs mb-2">Paste your Monetag MultiTag script here. It will be injected into every page automatically.</p>
          <Textarea
            value={config.monetagScript}
            onChange={(e) => setConfig({ ...config, monetagScript: e.target.value })}
            placeholder='<script src="https://alwingulla.com/88/tag.min.js" data-zone="XXXXX" async data-cfasync="false"></script>'
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 text-xs font-mono h-28"
          />
        </div>
      )}

      <Button
        onClick={saveConfig}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Ad Config
      </Button>
    </div>
  );
}