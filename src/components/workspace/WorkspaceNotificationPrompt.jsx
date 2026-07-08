import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WorkspaceNotificationPrompt({ isOpen, onClose, onEnable }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-md w-full rounded-2xl shadow-2xl bg-gradient-to-br from-[#1e1e1e] to-[#121212] border border-[#D4AF37]/30 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-yellow-500">
              <Bell className="w-6 h-6 text-black font-bold" />
            </div>
            <button
              onClick={onClose}
              className="text-[#F8F8F2]/60 hover:text-[#F8F8F2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-xl font-bold mb-2 text-[#F8F8F2]">
            Enable Workspace Notifications?
          </h3>
          
          <p className="text-sm mb-6 text-[#F8F8F2]/70 leading-relaxed">
            Stay updated with real-time alerts when team members send messages to your workspaces. You'll receive notifications even when you aren't actively checking the channel.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-[#D4AF37]/30 text-[#F8F8F2] hover:bg-[#D4AF37]/10 bg-transparent"
            >
              Not Now
            </Button>
            <Button
              onClick={async () => {
                await onEnable();
                onClose();
              }}
              className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold"
            >
              Enable Notifications
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
