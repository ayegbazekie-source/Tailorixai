import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SQL = `-- ============================================================
-- Tailorix AI — Full Supabase Migration SQL
-- Generated: 2026-06-24
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT,
  email               TEXT,
  role                TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  terms_accepted      BOOLEAN DEFAULT FALSE,
  is_premium          BOOLEAN DEFAULT FALSE,
  premium_plan        TEXT,
  premium_expires_at  TIMESTAMPTZ,
  credits             JSONB DEFAULT '{}',
  ads_watched_today   INT DEFAULT 0,
  last_credit_reset   DATE,
  created_date        TIMESTAMPTZ DEFAULT NOW(),
  updated_date        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. GENERATED DESIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generated_designs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  prompt        TEXT,
  design_type   TEXT,
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. DESIGN VERSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.design_versions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id          UUID NOT NULL,
  version_number     INT NOT NULL,
  image_url          TEXT NOT NULL,
  prompt             TEXT,
  changed_by         TEXT,
  change_description TEXT,
  created_date       TIMESTAMPTZ DEFAULT NOW(),
  updated_date       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. SHARED DESIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shared_designs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id         UUID NOT NULL,
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  permission        TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'comment', 'edit')),
  accepted          BOOLEAN DEFAULT FALSE,
  created_date      TIMESTAMPTZ DEFAULT NOW(),
  updated_date      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. DESIGN COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.design_comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id    UUID NOT NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name    TEXT NOT NULL,
  comment      TEXT NOT NULL,
  likes        INT DEFAULT 0,
  liked_by     TEXT[] DEFAULT '{}',
  replies      JSONB DEFAULT '[]',
  position     JSONB,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. INSPIRATION POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inspiration_posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name    TEXT NOT NULL,
  image_url    TEXT NOT NULL,
  prompt       TEXT NOT NULL,
  body_type    TEXT,
  fabric_type  TEXT,
  occasion     TEXT,
  design_type  TEXT,
  likes        INT DEFAULT 0,
  remix_count  INT DEFAULT 0,
  liked_by     TEXT[] DEFAULT '{}',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_name     TEXT NOT NULL,
  actor_id       TEXT,
  type           TEXT NOT NULL CHECK (type IN ('like','comment','remix','comment_like','comment_reply','review_response')),
  post_id        TEXT NOT NULL,
  post_preview   TEXT,
  post_image_url TEXT,
  is_read        BOOLEAN DEFAULT FALSE,
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name      TEXT NOT NULL,
  is_premium     BOOLEAN DEFAULT FALSE,
  rating         INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT NOT NULL,
  admin_response TEXT,
  response_at    TIMESTAMPTZ,
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. WORKSPACES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  host_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_user_email TEXT NOT NULL,
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. WORKSPACE MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email   TEXT NOT NULL,
  user_name    TEXT,
  role         TEXT NOT NULL CHECK (role IN ('host','supervisor','tailor')),
  is_online    BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

-- ============================================================
-- 11. WORKSPACE DESIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_designs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  design_id       UUID,
  title           TEXT NOT NULL,
  preview_url     TEXT NOT NULL,
  created_by_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  last_edited_by  TEXT,
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. WORKSPACE VERSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_versions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id       UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  design_id          UUID NOT NULL,
  version_number     INT NOT NULL,
  preview_url        TEXT NOT NULL,
  edited_by_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edited_by_name     TEXT NOT NULL,
  change_description TEXT,
  created_date       TIMESTAMPTZ DEFAULT NOW(),
  updated_date       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. WORKSPACE MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id   UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name    TEXT NOT NULL,
  message_text   TEXT NOT NULL,
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. APP CONFIG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_config (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key          TEXT NOT NULL UNIQUE,
  value        TEXT NOT NULL,
  description  TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. FABRICS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fabrics (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                      TEXT NOT NULL,
  description               TEXT,
  image_url                 TEXT,
  difficulty                TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  stiffness                 NUMERIC,
  thickness                 NUMERIC,
  speed_tolerance           NUMERIC,
  slip_factor               NUMERIC,
  recommended_stitch_length NUMERIC,
  tips                      TEXT[] DEFAULT '{}',
  unlock_level              INT,
  created_date              TIMESTAMPTZ DEFAULT NOW(),
  updated_date              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. STITCH TYPES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stitch_types (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  description    TEXT,
  icon           TEXT,
  difficulty     TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  default_length NUMERIC,
  min_length     NUMERIC,
  max_length     NUMERIC,
  best_for       TEXT[] DEFAULT '{}',
  unlock_level   INT,
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. LESSONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  "order"         INT NOT NULL,
  difficulty      TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  fabric_id       UUID REFERENCES public.fabrics(id),
  stitch_type_id  UUID REFERENCES public.stitch_types(id),
  objectives      TEXT[] DEFAULT '{}',
  instructions    JSONB DEFAULT '[]',
  target_speed    NUMERIC,
  target_accuracy NUMERIC,
  xp_reward       INT,
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 18. USER PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_level       INT DEFAULT 1,
  total_xp          INT DEFAULT 0,
  completed_lessons TEXT[] DEFAULT '{}',
  unlocked_fabrics  TEXT[] DEFAULT '{}',
  unlocked_stitches TEXT[] DEFAULT '{}',
  practice_sessions INT DEFAULT 0,
  total_stitches    INT DEFAULT 0,
  best_accuracy     NUMERIC,
  achievements      JSONB DEFAULT '[]',
  created_date      TIMESTAMPTZ DEFAULT NOW(),
  updated_date      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 19. SEWING SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sewing_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id        UUID REFERENCES public.lessons(id),
  mode             TEXT NOT NULL CHECK (mode IN ('learn','practice','challenge')),
  fabric_id        UUID REFERENCES public.fabrics(id),
  stitch_type_id   UUID REFERENCES public.stitch_types(id),
  stitch_length    NUMERIC,
  duration_seconds NUMERIC,
  stitch_data      JSONB,
  accuracy_score   NUMERIC,
  speed_score      NUMERIC,
  overall_score    NUMERIC,
  ai_feedback      JSONB,
  passed           BOOLEAN,
  xp_earned        INT,
  created_date     TIMESTAMPTZ DEFAULT NOW(),
  updated_date     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_generated_designs_user_id    ON public.generated_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_design_comments_design_id    ON public.design_comments(design_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_posts_user_id    ON public.inspiration_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_posts_created    ON public.inspiration_posts(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient      ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created        ON public.notifications(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace  ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_messages_workspace ON public.workspace_messages(workspace_id, created_date DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_designs_workspace  ON public.workspace_designs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sewing_sessions_user_id      ON public.sewing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id        ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created              ON public.reviews(created_date DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_designs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_designs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspiration_posts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_designs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fabrics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stitch_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sewing_sessions    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"       ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own"       ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "designs_all_own"        ON public.generated_designs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "design_versions_select" ON public.design_versions FOR SELECT USING (true);
CREATE POLICY "design_versions_insert" ON public.design_versions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "shared_designs_owner"   ON public.shared_designs FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "shared_designs_viewer"  ON public.shared_designs FOR SELECT USING (shared_with_email = (SELECT email FROM public.users WHERE id = auth.uid()));
CREATE POLICY "comments_select_all"    ON public.design_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own"    ON public.design_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_own"    ON public.design_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comments_delete_own"    ON public.design_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "posts_select_all"       ON public.inspiration_posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_own"       ON public.inspiration_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own"       ON public.inspiration_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own"       ON public.inspiration_posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "notifications_own"      ON public.notifications FOR ALL USING (auth.uid() = recipient_id);
CREATE POLICY "notifications_insert"   ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "reviews_select_all"     ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own"     ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own"     ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "workspaces_host_all"    ON public.workspaces FOR ALL USING (auth.uid() = host_user_id);
CREATE POLICY "workspaces_member_read" ON public.workspaces FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid()));
CREATE POLICY "wm_select_members"      ON public.workspace_members FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND host_user_id = auth.uid()));
CREATE POLICY "wm_insert_host"         ON public.workspace_members FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND host_user_id = auth.uid()));
CREATE POLICY "wm_delete_host"         ON public.workspace_members FOR DELETE USING (EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND host_user_id = auth.uid()));
CREATE POLICY "wd_members_all"         ON public.workspace_designs FOR ALL USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = workspace_designs.workspace_id AND user_id = auth.uid()));
CREATE POLICY "wv_members_all"         ON public.workspace_versions FOR ALL USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = workspace_versions.workspace_id AND user_id = auth.uid()));
CREATE POLICY "wmsg_members_all"       ON public.workspace_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = workspace_messages.workspace_id AND user_id = auth.uid()));
CREATE POLICY "app_config_read"        ON public.app_config FOR SELECT USING (true);
CREATE POLICY "fabrics_read"           ON public.fabrics FOR SELECT USING (true);
CREATE POLICY "stitch_types_read"      ON public.stitch_types FOR SELECT USING (true);
CREATE POLICY "lessons_read"           ON public.lessons FOR SELECT USING (true);
CREATE POLICY "progress_own"           ON public.user_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sessions_own"           ON public.sewing_sessions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUTO updated_date TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','generated_designs','design_versions','shared_designs',
    'design_comments','inspiration_posts','notifications','reviews',
    'workspaces','workspace_members','workspace_designs','workspace_versions',
    'workspace_messages','app_config','fabrics','stitch_types','lessons',
    'user_progress','sewing_sessions'
  ]
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_date();', t, t);
  END LOOP;
END;
$$;

-- ============================================================
-- AUTO-CREATE public.users ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspiration_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.design_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_designs;
`;

export default function SupabaseMigration() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Supabase Migration SQL</h1>
            <p className="text-slate-400 text-sm mt-1">Copy this and paste it into Supabase → SQL Editor → New Query → Run</p>
          </div>
          <Button
            onClick={handleCopy}
            className={`gap-2 ${copied ? 'bg-green-600 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy All SQL'}
          </Button>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-700 border-b border-slate-600">
            <span className="text-xs text-slate-400 font-mono">tailorix_migration.sql</span>
            <span className="text-xs text-slate-500">{SQL.split('\n').length} lines</span>
          </div>
          <pre className="p-4 text-xs text-slate-300 font-mono overflow-auto max-h-[70vh] leading-relaxed whitespace-pre">
            {SQL}
          </pre>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-green-400 font-semibold mb-1">✅ Step 1</div>
            <div className="text-slate-300">Copy SQL → paste in Supabase SQL Editor → Run</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-blue-400 font-semibold mb-1">🔑 Step 2</div>
            <div className="text-slate-300">Add <code className="text-yellow-400">SUPABASE_URL</code> + <code className="text-yellow-400">SUPABASE_SERVICE_ROLE_KEY</code> as secrets here in Base44</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-purple-400 font-semibold mb-1">⚡ Step 3</div>
            <div className="text-slate-300">Ask me to rewrite backend functions to use Supabase instead of Base44 entities</div>
          </div>
        </div>
      </div>
    </div>
  );
}