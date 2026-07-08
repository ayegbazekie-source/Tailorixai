import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { History, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VersionHistoryTab({ workspaceId, currentUser, memberRole }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
    
    // Setup real-time listener for workspace version history updates
    const channel = supabase
      .channel(`workspace-versions-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_versions',
          filter: `workspace_id=eq.${workspaceId}`
        },
        () => {
          loadVersions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_versions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast.error('Could not sync workspace version logs');
    } finally {
      setLoading(false);
    }
  };

  const restoreVersion = async (version) => {
    if (memberRole === 'tailor') {
      toast.error('Only host and supervisors can restore versions');
      return;
    }

    try {
      // Logic placeholder for your app flow:
      // Typically, you update the master image in 'workspace_designs' using this version's configuration data.
      const currentVersionNumber = version.version_number || version.version;
      toast.success(`Version ${currentVersionNumber} restored`);
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast.error('Failed to restore version');
    }
  };

  const canRestore = memberRole === 'host' || memberRole === 'supervisor';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Version History</h2>

      {versions.length === 0 ? (
        <div className="text-center py-20">
          <History className="w-16 h-16 text-amber-400/30 mx-auto mb-4" />
          <p className="text-amber-200/60">No versions yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((version, index) => {
            const currentVersionNumber = version.version_number || version.version || (index + 1);
            const currentImg = version.preview_url || version.image_url;
            const timeStamp = version.created_at || version.created_date;
            
            return (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border-2 border-amber-500/20 flex items-center gap-6"
              >
                {currentImg && (
                  <img
                    src={currentImg}
                    alt={`Version ${currentVersionNumber}`}
                    className="w-24 h-24 object-cover rounded-xl"
                  />
                )}
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">
                    Version {currentVersionNumber}
                  </h3>
                  <p className="text-amber-200/70 text-sm">
                    By {version.edited_by_name || 'Designer'}
                  </p>
                  <p className="text-amber-200/50 text-xs mt-1">
                    {new Date(timeStamp).toLocaleString()}
                  </p>
                  {version.change_description && (
                    <p className="text-amber-200/60 text-sm mt-2">
                      {version.change_description}
                    </p>
                  )}
                </div>

                {canRestore && (
                  <Button
                    onClick={() => restoreVersion(version)}
                    variant="outline"
                    className="border-amber-500/30 text-amber-300 hover:bg-amber-900/20"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restore
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
