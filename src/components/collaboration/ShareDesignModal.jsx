import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Trash2, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareDesignModal({ isOpen, onClose, design, currentUser }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);

  React.useEffect(() => {
    if (isOpen && design?.id) {
      loadShares();
    }
  }, [isOpen, design?.id]);

  const loadShares = async () => {
    setLoadingShares(true);
    try {
      const { data, error } = await supabase
        .from('shared_designs')
        .select('*')
        .eq('design_id', design.id);

      if (error) throw error;
      setShares(data || []);
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setLoadingShares(false);
    }
  };

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('shared_designs')
        .insert([
          {
            design_id: design.id,
            owner_id: currentUser.id,
            shared_with_email: email.trim().toLowerCase(),
            permission: permission,
            accepted: false
          }
        ]);

      if (error) throw error;

      toast.success(`Design shared with ${email.trim()}`);
      setEmail('');
      setPermission('view');
      loadShares();
    } catch (error) {
      console.error('Error sharing design:', error);
      toast.error('Failed to share design access');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId) => {
    try {
      const { error } = await supabase
        .from('shared_designs')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast.success('Access configuration revoked');
      loadShares();
    } catch (error) {
      console.error('Error removing share:', error);
      toast.error('Failed to remove access');
    }
  };

  // Upgraded check tracking Pro status using Tailorix AI credentials
  if (!currentUser?.is_pro && !currentUser?.isPro) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-gradient-to-br from-[#1e1e1e] to-[#121212] border border-[#D4AF37]/30 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#D4AF37]">
              <Crown className="w-5 h-5" />
              Pro Feature
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-900">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#F8F8F2]">
              Collaboration is Premium Only
            </h3>
            <p className="text-[#F8F8F2]/70 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
              Share patterns, co-edit custom mockups in real-time, and track version logs with Tailorix AI Pro.
            </p>
            <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-900 font-bold px-8">
              Upgrade to Pro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-[#1e1e1e] to-[#121212] border border-[#D4AF37]/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-400 font-bold text-xl">
            <Users className="w-5 h-5" />
            Share Design Blueprint
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-[#F8F8F2]/80 text-xs font-semibold uppercase tracking-wider">Email Address</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                className="bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus-visible:ring-amber-500/30"
              />
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger className="w-32 bg-slate-950 border-slate-800 text-white focus:ring-amber-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="comment">Comment</SelectItem>
                  <SelectItem value="edit">Can Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleShare} 
            disabled={loading || !email.trim()} 
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold hover:from-amber-400"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sharing Access...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Invite Link
              </>
            )}
          </Button>

          <div className="border-t border-slate-800/80 pt-4">
            <Label className="text-xs font-semibold text-amber-200/50 uppercase tracking-wider">Shared With</Label>
            
            {loadingShares ? (
              <div className="text-center py-6">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />
              </div>
            ) : shares.length === 0 ? (
              <p className="text-sm text-[#F8F8F2]/40 text-center py-6 italic">
                This design asset hasn't been shared yet.
              </p>
            ) : (
              <div className="space-y-2 mt-2 max-h-[180px] overflow-y-auto pr-1">
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-bold text-slate-200 truncate">
                        {share.shared_with_email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] bg-slate-900 border-amber-500/20 text-amber-300 px-2 py-0">
                          {share.permission}
                        </Badge>
                        {!share.accepted && (
                          <span className="text-[11px] text-amber-400 font-medium">Pending Accept</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveShare(share.id)}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-950/20 shrink-0 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
              }
            
