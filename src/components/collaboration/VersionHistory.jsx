import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Clock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VersionHistory({ design, isOpen, onClose, onRestoreVersion }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && design?.id) {
      loadVersions();
    }
  }, [isOpen, design?.id]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('design_versions')
        .select('*')
        .eq('design_id', design.id)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version) => {
    try {
      await onRestoreVersion(version);
      toast.success(`Restored to version ${version.version_number}`);
      onClose();
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] bg-gradient-to-br from-[#1e1e1e] to-[#121212] border border-[#D4AF37]/20 text-white flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-400 font-bold text-xl">
            <History className="w-5 h-5" />
            Design Version Logs
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto pr-1 flex-1 mt-2">
          {loading ? (
            <div className="text-center py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 mx-auto mb-4 text-amber-500/20" />
              <p className="text-[#F8F8F2]/40 italic text-sm">No design edits or previous version steps saved yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => {
                const currentImg = version.image_url || version.preview_url;
                const timeStamp = version.created_at || version.created_date;
                
                return (
                  <div
                    key={version.id}
                    className="border border-slate-800 bg-slate-950/40 rounded-xl p-4 hover:border-amber-500/20 transition-colors"
                  >
                    <div className="flex gap-4">
                      {currentImg && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                          <img
                            src={currentImg}
                            alt={`Version ${version.version_number}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge 
                                className={index === 0 
                                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold" 
                                  : "bg-slate-900 text-amber-200/70 border border-amber-500/20"
                                }
                              >
                                Version {version.version_number}
                              </Badge>
                              {index === 0 && (
                                <span className="text-xs text-green-400 font-medium">Active Canvas</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#F8F8F2]/50">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(timeStamp).toLocaleString()}
                            </div>
                          </div>
                          {index !== 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestore(version)}
                              className="border-[#D4AF37]/30 text-amber-300 hover:bg-[#D4AF37]/10 bg-transparent shrink-0 text-xs h-8"
                            >
                              Restore
                            </Button>
                          )}
                        </div>
                        
                        {version.change_description && (
                          <p className="text-sm text-slate-200 mb-2 break-words">
                            {version.change_description}
                          </p>
                        )}
                        
                        {(version.changed_by || version.edited_by_name) && (
                          <div className="flex items-center gap-1 text-xs text-amber-200/40">
                            <User className="w-3 h-3" />
                            <span>By {version.changed_by || version.edited_by_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
