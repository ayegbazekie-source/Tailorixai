import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPlus, Crown, Shield, User as UserIcon, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MembersTab({ workspaceId, currentUser, memberRole, workspaceName }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('tailor');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadMembers();
    
    // Subscribe to real-time additions/removals of workspace members
    const channel = supabase
      .channel(`workspace-members-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${workspaceId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.success(`${payload.new.user_name || 'A new member'} joined the workspace`);
          }
          loadMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Failed to load members:', error);
      toast.error('Could not sync workspace members');
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setInviting(true);
    try {
      // Check if user exists in our primary profiles/users table
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', inviteEmail.trim())
        .maybeSingle();

      if (userError || !userProfile) {
        toast.error('User not found. They must be a registered Tailorix AI user.', {
          style: { background: '#1e1e1e', color: '#F8F8F2', border: '1px solid #D4AF37' },
          icon: '⚠️',
        });
        setInviting(false);
        return;
      }

      // Verify Pro status configuration
      if (!userProfile.is_pro && !userProfile.isPro) {
        toast.error('This user does not have an active Tailorix AI Pro subscription.', {
          style: { background: '#1e1e1e', color: '#F8F8F2', border: '1px solid #D4AF37' },
          icon: '👑',
        });
        setInviting(false);
        return;
      }

      // Check if already a member
      const existing = members.find(m => m.user_email === inviteEmail.trim());
      if (existing) {
        toast.error('User is already a member');
        setInviting(false);
        return;
      }

      // Add to workspace members table
      const { error: insertError } = await supabase
        .from('workspace_members')
        .insert([
          {
            workspace_id: workspaceId,
            user_id: userProfile.id,
            user_email: userProfile.email,
            user_name: userProfile.full_name || userProfile.email,
            role: inviteRole,
            is_online: false
          }
        ]);

      if (insertError) throw insertError;

      // Send real-time in-app notification to invited user
      let wsName = workspaceName;
      if (!wsName) {
        const { data: wsData } = await supabase
          .from('workspaces')
          .select('title')
          .eq('id', workspaceId)
          .maybeSingle();
        wsName = wsData?.title || 'a workspace';
      }

      await supabase.from('notifications').insert([
        {
          user_id: userProfile.id,
          title: 'New Team Invitation',
          message: `${currentUser?.full_name || 'A host'} invited you as a ${inviteRole} to "${wsName}"`,
          is_read: false
        }
      ]).catch((e) => console.error('Failed to create internal notice:', e));

      // Optional: If you have a custom mail function set up on your backend route or Edge Functions, trigger it here.
      console.log(`Deep-link email notification intended for: ${userProfile.email}`);

      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('tailor');
      toast.success('Member invited successfully', {
        style: { background: '#1e1e1e', color: '#F8F8F2', border: '1px solid #D4AF37' },
      });
    } catch (error) {
      console.error('Failed to invite member:', error);
      toast.error('Failed to complete invitation');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (member) => {
    if (memberRole !== 'host') {
      toast.error('Only the host can remove members');
      return;
    }

    if (member.role === 'host') {
      toast.error('Cannot remove the host');
      return;
    }

    if (!confirm(`Remove ${member.user_name} from workspace?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', member.id);

      if (error) throw error;
      toast.success('Member removed');
      loadMembers();
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'host':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'supervisor':
        return <Shield className="w-4 h-4 text-blue-400" />;
      default:
        return <UserIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      host: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900',
      supervisor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      tailor: 'bg-slate-700/50 text-slate-300'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[role]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Members ({members.length})</h2>
        {memberRole === 'host' && (
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 font-bold"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {members.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 border-2 border-amber-500/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center">
                  {getRoleIcon(member.role)}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                    member.is_online ? 'bg-green-500' : 'bg-slate-500'
                  }`}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white">{member.user_name}</h3>
                <p className="text-sm text-amber-200/60">{member.user_email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getRoleBadge(member.role)}
              
              {memberRole === 'host' && member.role !== 'host' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMember(member)}
                  className="text-amber-200/40 hover:text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-amber-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-400">Invite Member</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@example.com"
                type="email"
                className="bg-slate-900/50 border-amber-500/20 text-white"
              />
            </div>

            <div>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="bg-slate-900/50 border-amber-500/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tailor">Tailor (View only)</SelectItem>
                  <SelectItem value="supervisor">Supervisor (Can edit)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                className="flex-1 border-amber-500/30 text-amber-200/80 hover:bg-amber-900/20"
              >
                Cancel
              </Button>
              <Button
                onClick={inviteMember}
                disabled={inviting}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 font-bold"
              >
                {inviting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  'Invite'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
            }
                
