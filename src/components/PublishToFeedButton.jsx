import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Share2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePremium } from '@/components/PremiumProvider';

export default function PublishToFeedButton({ imageUrl, prompt, bodyType, fabricType, occasion, designType, className = '' }) {
  const { user } = usePremium();
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const handlePublish = async () => {
    if (!user || !imageUrl || published) return;
    setPublishing(true);
    try {
      await base44.entities.InspirationPost.create({
        user_id: user.id,
        user_name: user.full_name || user.email?.split('@')[0] || 'Anonymous',
        image_url: imageUrl,
        prompt: prompt || '',
        body_type: bodyType || '',
        fabric_type: fabricType || '',
        occasion: occasion || '',
        design_type: designType || 'create',
        likes: 0,
        remix_count: 0,
        liked_by: [],
      });
      setPublished(true);
    } catch (e) {
      console.error(e);
    }
    setPublishing(false);
  };

  return (
    <Button
      variant="outline"
      onClick={handlePublish}
      disabled={publishing || published || !imageUrl}
      className={`rounded-xl ${className}`}
    >
      {publishing ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing...</>
      ) : published ? (
        <><Check className="w-4 h-4 mr-2 text-green-500" />Published!</>
      ) : (
        <><Share2 className="w-4 h-4 mr-2" />Share to Feed</>
      )}
    </Button>
  );
}