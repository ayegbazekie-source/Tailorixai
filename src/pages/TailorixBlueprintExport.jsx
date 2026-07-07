import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Code, Database, Cpu, Users, MessageCircle, Image, Scissors, Shield, HelpCircle, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Full Blueprint Data ────────────────────────────────────────────────────────
const BLUEPRINT = {
  meta: {
    appName: "Tailorix AI",
    version: "3.0",
    ideology: `Tailorix AI is an AI-powered Professional Fashion Engineering Toolkit.
The core ideology rests on three pillars:

1. AI-INTEGRATED PRECISION
   Every tool is designed to output technical, production-ready specifications
   (grain lines, pattern markers, seam allowances) rather than just aesthetic concepts.
   The AI acts as a "Ghost Tailor" — it takes user constraints and generates engineering-
   grade assets, not mood-board images.

2. FREEMIUM PROFESSIONALISM
   The model is strict freemium: 2 daily free credits for core tools, with no ads.
   Premium (Pro) tier unlocks unlimited usage, Workspaces, and advanced Pro UI (dark/gold theme).
   Credit resets happen at midnight daily. No carry-over.

3. PLATFORM-FIRST ROBUSTNESS
   Built for hybrid environments (Web + Amazon Fire Tablet / PWA).
   Enforced light mode for free users. 44px minimum touch targets.
   Native-feel transitions. Edge-to-edge viewport with safe-area insets.`,
  },

  // ── DATABASE ENTITIES (recreate these tables in Supabase or your DB) ──────────
  entities: [
    {
      name: "User (Built-in — do not recreate)",
      fields: `id (string, auto)
full_name (string)
email (string)
role (enum: admin | user, default: user)
analysis_credits (integer, default: 2)
illustrator_credits (integer, default: 2)
solver_credits (integer, default: 2)
visualizer_credits (integer, default: 2)
last_credit_reset_date (date)
rewarded_ads_watched_today (integer, default: 0)
last_reward_date (datetime)
is_premium (boolean, default: false)
isPro (boolean, default: false)
proExpiresAt (datetime)
premium_expiry_date (date)
country (string)
terms_accepted (boolean)
created_date (datetime, auto)`,
    },
    {
      name: "GeneratedDesigns",
      fields: `id (string, auto)
user_id (string) — FK → User.id
image_url (string) — URL of stored AI-generated image
prompt (string) — Text prompt used to generate
design_type (string) — "create" | "modify" | "convert" | JSON string of deconstruct metadata
saved_by_user (boolean, default: false) — Only true when user clicks Save
created_date (datetime, auto)`,
    },
    {
      name: "InspirationPost",
      fields: `id (string, auto)
user_id (string) — FK → User.id
user_name (string)
image_url (string)
prompt (string)
body_type (string)
fabric_type (string)
occasion (string)
design_type (string) — "illustration" | "pattern"
likes (number, default: 0)
liked_by (array of string) — array of user IDs who liked
remix_count (number, default: 0)
comment_count (number, default: 0) — persisted for fast display
created_date (datetime, auto)`,
    },
    {
      name: "DesignComment",
      fields: `id (string, auto)
design_id (string) — FK → InspirationPost.id
user_id (string) — FK → User.id
user_name (string)
comment (string)
likes (number, default: 0)
liked_by (array of string)
replies (array of objects: { user_name, text, created_at })
created_date (datetime, auto)`,
    },
    {
      name: "Notification",
      fields: `id (string, auto)
recipient_id (string) — FK → User.id
actor_name (string)
actor_id (string) — FK → User.id
type (enum: like | comment | remix | comment_like | comment_reply | review_response)
post_id (string) — FK → InspirationPost.id
post_preview (string) — short text excerpt
post_image_url (string)
is_read (boolean, default: false)
created_date (datetime, auto)`,
    },
    {
      name: "Workspace",
      fields: `id (string, auto)
name (string)
host_user_id (string) — FK → User.id
host_user_email (string)
created_date (datetime, auto)`,
    },
    {
      name: "WorkspaceMember",
      fields: `id (string, auto)
workspace_id (string) — FK → Workspace.id
user_id (string) — FK → User.id
user_email (string)
user_name (string)
role (enum: host | supervisor | tailor)
is_online (boolean, default: false)`,
    },
    {
      name: "WorkspaceDesign",
      fields: `id (string, auto)
workspace_id (string) — FK → Workspace.id
design_id (string) — FK → GeneratedDesigns.id
title (string)
preview_url (string)
created_by_id (string) — FK → User.id
created_by_name (string)
last_edited_by (string)
created_date (datetime, auto)`,
    },
    {
      name: "WorkspaceMessage",
      fields: `id (string, auto)
workspace_id (string) — FK → Workspace.id
sender_user_id (string) — FK → User.id
sender_name (string)
message_text (string)
created_date (datetime, auto)`,
    },
    {
      name: "WorkspaceVersion",
      fields: `id (string, auto)
workspace_id (string) — FK → Workspace.id
design_id (string) — FK → WorkspaceDesign.id
version_number (number)
preview_url (string)
edited_by_id (string) — FK → User.id
edited_by_name (string)
change_description (string)
created_date (datetime, auto)`,
    },
    {
      name: "Review",
      fields: `id (string, auto)
user_id (string) — FK → User.id
user_name (string)
is_premium (boolean, default: false)
rating (integer, 1–5)
comment (string)
admin_response (string)
response_at (datetime)
created_date (datetime, auto)`,
    },
    {
      name: "AppConfig",
      fields: `id (string, auto)
key (string) — e.g. "is_production"
value (string) — e.g. "true" or "false"
description (string)`,
    },
  ],

  // ── FEATURE: FASHION ILLUSTRATOR ─────────────────────────────────────────────
  fashionIllustrator: {
    name: "Fashion Illustrator",
    description: "AI-powered fashion illustration generator. Takes a text description and returns a professional technical fashion illustration.",
    apiUsed: "Image Generation API (OpenAI DALL-E 3 or Stability AI)",
    creditCost: "1 credit per generation (Free users). Unlimited for Pro.",
    tabs: ["Create New (Free)", "Modify Existing (Pro)", "Convert Style (Pro)"],
    createPromptTemplate: `[TAILORIX AI — PROFESSIONAL FASHION ILLUSTRATION SYSTEM]

You are a senior fashion illustrator. Produce a PROFESSIONAL FASHION ILLUSTRATION based on this design brief:

DESIGN BRIEF: "{USER_PROMPT}"

ILLUSTRATION REQUIREMENTS:
• Full-length front-facing fashion croquis on an elongated 9-head figure proportion.
• Clean white background. Professional studio lighting.
• Draw EVERY seam line, panel division, dart, pleat, and detail visible from the design brief.
• Neckline, sleeves, waistline, and closures must be precise and accurate.
• Fabric grain shown via light directional shading or subtle texture — no flat block colors.
• If African print (Ankara/Kente/Adire) is mentioned — render realistic geometric/wax print pattern.
• If lace, velvet, organza, or chiffon — show appropriate fabric drape and texture.
• NO text labels, NO annotation arrows, NO construction callout boxes on the image.
• Bottom-center watermark only: "TAILORIX AI © Illustration" in small elegant serif typography.
• Subtle drop shadow under the figure for depth.

OUTPUT: One clean, professional, print-ready fashion illustration.`,
    examplePrompts: [
      "Fitted off-shoulder Ankara maxi gown with high slit and peplum waist",
      "Structured blazer dress with African print lining, peak lapels, and double-breasted closure",
      "High-waist palazzo trousers with wrap-front blouse in kente fabric, flutter sleeves",
      "Sweetheart neckline corset bodice with A-line tulle skirt and lace overlay",
    ],
    saveLogic: `After generation:
1. Call GeneratedDesigns.create({ user_id, image_url: response.url, prompt, design_type: "create" })
2. saved_by_user defaults to false — only set true when user explicitly clicks "Save"
3. Profile page only shows designs where saved_by_user === true`,
    freemiumGating: `if (!hasCredits) → show UpgradeModal
if (!isPremium) → await deductCredit('illustrator') before calling API
if (deductCredit fails) → abort, do not call AI API`,
  },

  // ── FEATURE: GARMENT DECONSTRUCT ─────────────────────────────────────────────
  garmentDeconstruct: {
    name: "Garment Deconstruct",
    description: "4-step AI garment reverse-engineering tool. Upload photo → Analysis → Confirm → Illustration → Pattern Board.",
    steps: [
      "Step 1 (FREE): Upload garment photo → AI analysis via LLM Vision",
      "Step 2: User confirms/corrects analysis",
      "Step 3 (1 credit): Generate reconstruction illustration via Image Generation API",
      "Step 4: Generate full pattern layout board via Image Generation API",
    ],
    apiUsed: "LLM Vision API (GPT-4o or Gemini Pro Vision) + Image Generation API",
    analysisPrompt: `[TAILORIX AI — MASTER GARMENT ENGINEERING SYSTEM v3]

You are Tailorix AI's Chief Pattern Engineer — trained in Armstrong Patternmaking (5th ed.), Aldrich Metric Pattern Cutting.
Think EXACTLY like a master tailor at a cutting table, reverse-engineering this garment for full-scale pattern drafting.

PHASE 1: GARMENT CLASSIFICATION
Identify using the PRECISE FORMULA:
[Silhouette Type] + [Neckline Shape] + [Sleeve Classification] + [Length/Level] + [Dominant Construction Feature]
Example: "Fitted Princess-Seam Sweetheart Strapless Midi Gown with Basque Waist"

PHASE 2: STRUCTURAL DECONSTRUCTION
List every structural component with EXACT technical labels:
BODICE OPTIONS: Princess-seam bodice / Darted bodice / Bustier / Boned corset / Bias-cut bodice
NECKLINE: Sweetheart / Off-shoulder / V-neck / Strapless / Halter / Bateau / Scoop
SLEEVE: Set-in / Raglan / Kimono / Flutter / Cap / None
CLOSURE: Invisible zip / Exposed zip / Buttons / Hook-and-eye

PHASE 3: PATTERN PIECE BREAKDOWN
List EVERY pattern piece with exact cut quantities:
Format: "Front bodice panel × 2 (cut on fold if no CF seam)"

PHASE 4: FABRIC & INTERNAL SUPPORT
Technical fabric name. Interfacing zones. Boning specifications.

PHASE 5: SEAM & DART SPECIFICATIONS
Standard SA: 1.5cm. Dart types. Notch positions. Hem allowance.

PHASE 6: CONSTRUCTION SEQUENCE (10-14 steps)

PHASE 7: VALIDATION CHECK
- Sewability check, balance check, construction challenges.
- Confidence: High / Medium / Low

Return JSON with:
garment_type, silhouette, neckline, sleeve_type, structural_components (array),
pattern_pieces (string), decorative_elements (array), fabric_type,
interfacing_notes, support_notes, construction_order (array),
validation_notes (array), technical_notes (array),
analysis_summary, reconstruction_notes, confidence_level`,

    illustrationPrompt: `[TAILORIX AI — MASTER TECHNICAL RECONSTRUCTION v3]
Lead Technical Illustrator role. Produce highest-fidelity technical reconstruction illustration.
NOT a fashion mood illustration — engineering-grade drawing for physical pattern drafting.

GARMENT DATA (injected from analysis):
Garment: {analysis.garment_type}
Silhouette: {analysis.silhouette}
Neckline: {analysis.neckline}
Sleeve: {analysis.sleeve_type}
Structural Components: {analysis.structural_components.join(" | ")}
Pattern Pieces: {analysis.pattern_pieces}
Fabric: {analysis.fabric_type}
User Corrections (override everything): {userFeedback}

RULES:
RULE 1 — SILHOUETTE FIDELITY: Trace EXACT outer silhouette from photo. ZERO artistic license.
RULE 2 — PANEL COUNT: Count and draw EVERY visible panel seam.
RULE 3 — SEAM LINE WEIGHTS: Outer silhouette 3pt | Internal seams 1.5pt | Dart lines 0.7pt dashed
RULE 4 — VERTICAL CONTINUITY: Do NOT add horizontal waist seam unless physically present.
RULE 5 — CONSTRUCTION MARKERS: Show dart positions, notch marks, grain arrows, ease marks.
RULE 6 — ANNOTATIONS: Label each section: FRONT BODICE, SIDE PANEL, BACK PANEL, etc.
RULE 7 — USER CORRECTIONS OVERRIDE ALL visual data.

FREE RENDER: Crisp professional technical flat on pure white. NO color fills. Black line art only.
PRO RENDER: Ghost mannequin with full fabric texture cloned from photo. Deep navy background.`,

    patternBoardPrompt: `[TAILORIX AI — MASTER PATTERN DRAFTING v3]
Chief Pattern Drafter role. Produce a PROFESSIONALLY DRAFTED flat pattern layout board.

SECTION A (top 12%): Garment reference illustration with callout labels.
SECTION B (middle 55%): ALL pattern pieces on GRAPH-PAPER GRID (5mm squares).
  Every piece MUST have:
  ① PIECE LABEL: "FRONT BODICE PANEL — CUT 2 | MAIN FABRIC"
  ② GRAINLINE ARROW: vertical double-headed arrow labeled "GRAIN ↕"
  ③ SEAM ALLOWANCE: dashed border 1.5cm from cut edge, labeled "S.A. = 1.5cm"
  ④ DARTS: triangle shape with stitch direction
  ⑤ NOTCHES: ▷ front, ▷▷ back
  ⑥ BALANCE MARKS at curved seam joins
  ⑦ CONSTRUCTION ZONES: cross-hatch for interfacing, parallel dashes for boning
  ⑧ FOLD INDICATOR: "PLACE ON FOLD"
  ⑨ ZIP PLACEMENT if applicable
SECTION C (bottom 33%): 14-step professional construction guide in plain English.

FREE RENDER: All white, black line art, professional technical draft quality.
PRO RENDER: Indigo & gold premium board with fabric texture fills.`,
  },

  // ── FEATURE: INSPIRATION FEED ────────────────────────────────────────────────
  inspirationFeed: {
    name: "Inspiration Feed",
    description: "Community gallery of AI-generated designs. Social engagement (likes, comments, remixes). Real-time updates via subscriptions.",
    noAIRequired: true,
    dataFlow: `1. Load InspirationPost.list() — sorted by trending score or recent
2. Load DesignComment.list() — aggregate comment_count per post
3. Trending score formula: (likes×3 + comments×5 + remixes×2) / (ageHours + 2)^1.5
4. Real-time: subscribe to InspirationPost and DesignComment for live updates`,
    likeLogic: `async handleLike(post):
  alreadyLiked = post.liked_by.includes(currentUser.id)
  newLikedBy = alreadyLiked ? filter out user : append user
  optimistic update UI immediately
  await InspirationPost.update(post.id, { liked_by: newLikedBy, likes: newLikedBy.length })
  if (!alreadyLiked) → create Notification(type: "like", recipient: post.user_id)`,
    commentLogic: `async addComment(postId, text):
  await DesignComment.create({ design_id: postId, user_id, user_name, comment: text })
  newCount = existing comment_count + 1 + replies.length
  await InspirationPost.update(postId, { comment_count: newCount })
  create Notification(type: "comment", recipient: post.user_id)`,
    remixLogic: `PREMIUM ONLY:
  await InspirationPost.update(post.id, { remix_count: post.remix_count + 1 })
  create Notification(type: "remix", recipient: post.user_id)
  navigate to DesignGenerator with URL params:
  ?remix_tab=modify&remix_image_url=...&remix_prompt=...`,
    publishLogic: `PublishToFeedButton component:
  1. Content moderation check via InvokeLLM({ prompt: image_url })
  2. If approved: InspirationPost.create({ user_id, user_name, image_url, prompt, design_type })
  3. If flagged: show ModerationAlert modal`,
    freemiumGating: "Like/Comment: Free. Remix: Pro only. Publishing: both (moderation applied).",
  },

  // ── FEATURE: AI CHAT (AITUTOR) ───────────────────────────────────────────────
  aiChat: {
    name: "Tailorix AI Chat",
    description: "Free conversational AI assistant for all tailoring questions. Uses LLM with a tailoring-specialized system prompt.",
    apiUsed: "LLM API (GPT-4o-mini or Gemini Flash)",
    creditCost: "FREE — no credits required for any user",
    systemPrompt: `You are Tailorix AI, a master tailor professional with 30+ years of experience.
CHARACTER: Supportive friend, not formal teacher. Understand the emotions of tailors.
Listen before advising. Teach like a master tutor.

RULES:
1. ONLY answer sewing, tailoring, fashion, patterns, alterations, AND Tailorix AI app feature questions.
2. If asked unrelated topics, redirect: "I'd love to help, but I'm specifically here for tailoring questions..."
3. Before solutions, ask clarifying questions if needed.
4. Adapt tone to user skill level.
5. Use numbered steps for processes, conversational tone.
6. Encourage progress and celebrate effort.
7. Share professional tips and common mistakes.
8. Inform on app features based on user plan (Free or Premium).

APP CONTEXT: Inject full feature list (free vs premium) into each message.
Return JSON: { response: string, is_tailoring_related: boolean, suggested_followup: string }`,
    conversationManagement: `State: messages array [{ role: "user"|"assistant", content: string, followup?: string }]
Each LLM call: include full conversation history as formatted string:
  "Tailor: {userMessage}"
  "Tailorix AI: {aiResponse}"
Quick questions shown when messages.length <= 2.
Clear chat resets to welcome message only.`,
  },

  // ── FEATURE: USER PROFILE ────────────────────────────────────────────────────
  userProfile: {
    name: "User Profile",
    description: "Account management, saved designs gallery, subscription status, theme preferences, and admin controls.",
    userProperties: `Displayed: full_name, email, profile picture (avatar_url), role, isPro status
Credits shown: analysis_credits, illustrator_credits, solver_credits, visualizer_credits
Subscription: isPro, proExpiresAt, premium_expiry_date
Admin-only: role === "admin" gate for admin control panel`,
    savedDesignsLogic: `Load: GeneratedDesigns.filter({ user_id: currentUser.id, saved_by_user: true })
Delete: GeneratedDesigns.delete(design.id)
Gallery: masonry grid with lightbox on tap
Profile picture upload: UploadFile → base44.auth.updateMe({ avatar_url })`,
    themeLogic: `Free users: ALWAYS light mode. No dark mode toggle.
Pro users: Dark mode automatically enabled (pro theme: dark + gold accents).
Theme stored in localStorage as "light" | "dark".
Force light on boot: localStorage.setItem("theme", "light") before React mounts.`,
    adminControls: `Only visible if user.role === "admin":
- Toggle IS_PRODUCTION mode (AppConfig entity)
- Override premium status for testing
- View/set subscription IDs
- Access AdminDashboard (/AdminDashboard route)`,
    creditDisplay: `CreditDisplay component shows: N credits remaining
If credits === 0: show "Out of Credits" + Upgrade CTA
Credits auto-reset at midnight via scheduled backend function (dailyMidnightReset)`,
  },

  // ── FEATURE: HELP & SUPPORT ──────────────────────────────────────────────────
  helpAndSupport: {
    name: "Help & Support System",
    description: "Floating help button with FAQ accordion. Content differs for Free vs Pro users.",
    structure: `HelpOverlay component — floating button (bottom-right, z-index 9999)
Opens animated full-screen modal with:
  - Categorized FAQ accordion sections (Free: 4 sections, Pro: 5 sections)
  - Each section expands to show Q&A pairs
  - Video tutorial links (YouTube, Instagram)
  - Support email contact`,
    freeTopics: `1. Credits & Daily Limits — how credits work, which tools use them
2. Generate Fashion Designs — illustrator usage
3. Garment Deconstruct — 4-step pattern tool
4. Tailorix AI Chat — free unlimited chat`,
    proTopics: `1. AI Design Illustrator Pro — Create/Modify/Convert
2. Garment Deconstruct Pro — unlimited all 4 steps
3. Fabric Visualizer Pro — garment templates + customization
4. Team Collaboration Workspaces — roles, versioning, chat
5. Tailorix AI Assistant — expert tailoring chat`,
    supportContact: `Email: dkadristailoringservice@gmail.com
YouTube: https://www.youtube.com/@TailorixAi
Instagram: https://www.instagram.com/dkadris_tailoring`,
  },

  // ── FEATURE: NOTIFICATIONS ───────────────────────────────────────────────────
  notifications: {
    name: "Notification System",
    description: "In-app bell icon for feed engagement notifications (likes, comments, remixes).",
    notificationTypes: "like | comment | remix | comment_like | comment_reply | review_response",
    creationLogic: `Create a Notification record whenever:
- Someone likes your InspirationPost → type: "like"
- Someone comments on your post → type: "comment"
- Someone remixes your design → type: "remix"
- Someone likes your comment → type: "comment_like"
- Someone replies to your comment → type: "comment_reply"
- Admin responds to your review → type: "review_response"

Rule: NEVER create notification if actor === recipient (no self-notifications)`,
    displayLogic: `NotificationBell component:
- Load Notification.filter({ recipient_id: currentUser.id })
- Unread count = notifications.filter(n => !n.is_read).length
- Badge shows unread count (red dot or number)
- Click → open dropdown, mark all as read
- Click notification → navigate to post (setSelectedPost in InspirationFeed)`,
    markRead: `On bell open: Notification.updateMany({ recipient_id: currentUser.id, is_read: false }, { $set: { is_read: true } })`,
    cleanup: `Scheduled backend function "cleanOldNotifications" runs daily:
Deletes Notification records older than 30 days to prevent DB bloat.`,
  },

  // ── FEATURE: ADMIN CONTROL ───────────────────────────────────────────────────
  adminControl: {
    name: "Admin Dashboard & Controls",
    description: "Admin-only metrics dashboard and platform control panel.",
    accessGate: `if (user.role !== "admin") → show "Access Denied" screen
Route: /AdminDashboard — added explicitly to App.jsx router`,
    metricsDisplayed: `Summary Cards: Total Users, Premium Users (+ conversion %), Active Today, Recent Designs
Charts (14-day trend): Daily Active Users, Signups, Designs Generated
Pie Charts: Free vs Premium breakdown, Platform breakdown (Web/Play/Amazon)
KPI Banner: Free→Premium conversion rate`,
    backendFunction: `adminMetrics backend function:
- Authenticates caller: base44.auth.me() + role === "admin" check
- Queries User entity for total, premium, free counts
- Calculates DAU from last_credit_reset_date === today
- Calculates signups per day from created_date
- Calculates designs per day from GeneratedDesigns
- Returns: { summary, dailyTrend[] }`,
    productionToggle: `AppConfig entity key "is_production":
- In dev mode: purchases are simulated (no real money)
- In production mode: real Amazon IAP / payment flows active
- Toggle via setProductionMode backend function (admin-only)`,
    creditOverride: `Admin can override individual user credits via UserProfile admin panel.
Used for support cases (manually grant credits).`,
  },

  // ── CREDIT SYSTEM ────────────────────────────────────────────────────────────
  creditSystem: {
    name: "Credit System (useCreditSystem hook)",
    fields: `user.analysis_credits
user.illustrator_credits  
user.solver_credits
user.visualizer_credits`,
    resetLogic: `Backend function: dailyMidnightReset
Scheduled: every day at midnight Africa/Lagos time
Logic: User.updateMany({ last_credit_reset_date: { $ne: today } }, { $set: { analysis_credits: 2, illustrator_credits: 2, solver_credits: 2, visualizer_credits: 2, rewarded_ads_watched_today: 0, last_credit_reset_date: today } })`,
    deductLogic: `Backend function: deductCredit
Input: { featureType: "analysis"|"illustrator"|"solver"|"visualizer" }
Logic: 
  1. Get user
  2. Check user[featureType + "_credits"] > 0
  3. Decrement by 1
  4. Return { success: true, remaining: newBalance }`,
    premiumBypass: `If user.isPro === true AND proExpiresAt > now:
  Skip all credit checks entirely
  No deductions, no gates`,
  },

  // ── FREEMIUM / PREMIUM GATING PATTERN ────────────────────────────────────────
  premiumGating: {
    name: "Premium Gating Pattern",
    checkLogic: `PremiumProvider (React Context):
  1. await base44.auth.me()
  2. isPro = user.isPro === true && new Date(user.proExpiresAt) > new Date()
  3. Store in context: { user, isPremiumActive: isPro }
  4. All pages use usePremium() hook to access this`,
    uiGating: `Free feature: show normally
Premium feature (locked): show card with Lock icon + amber border + "PREMIUM" badge
  → onClick: setShowUpgradeModal(true)
  → UpgradeModal shows benefits + price + buy button`,
    themeGating: `isPremiumActive === true → dark mode (Pro UI: dark + gold accent #D4AF37)
isPremiumActive === false → ALWAYS light mode (#efefef background)`,
  },

  // ── WORKSPACE COLLABORATION ───────────────────────────────────────────────────
  workspaceCollaboration: {
    name: "Team Collaboration Workspaces",
    description: "Multi-user design rooms with role-based permissions, version history, real-time chat, and design comments.",
    roles: `host — Full control (create/edit/delete/invite members)
supervisor — Edit designs + comment
tailor — View + comment only`,
    coreFlow: `1. Create Workspace → Workspace.create({ name, host_user_id, host_user_email })
2. Auto-create WorkspaceMember for host with role: "host"
3. Invite member → WorkspaceMember.create({ workspace_id, user_email, role })
   → base44.users.inviteUser(email, "user") if not existing
4. Add design → WorkspaceDesign.create({ workspace_id, title, preview_url, created_by_id })
5. Edit design → WorkspaceVersion.create({ workspace_id, design_id, version_number: prev+1, preview_url })
6. Chat → WorkspaceMessage.create({ workspace_id, sender_user_id, sender_name, message_text })
7. Real-time: subscribe to WorkspaceMessage for live chat updates`,
    versionLogic: `WorkspaceVersion entity stores every edit.
Version History tab shows all versions sorted by version_number DESC.
Restore version: WorkspaceDesign.update(designId, { preview_url: version.preview_url })`,
    permissionCheck: `userRole = WorkspaceMember.filter({ workspace_id, user_id: currentUser.id })[0].role
canEdit = ["host", "supervisor"].includes(userRole)
canManageMembers = userRole === "host"
canDelete = userRole === "host"`,
  },
};

// ─── Section Component ──────────────────────────────────────────────────────────
function Section({ title, icon: SectionIcon, color, children }) {
  const Icon = SectionIcon;
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-slate-800 flex-1">{title}</span>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">{label}</p>
      <pre className="text-xs bg-white border border-slate-200 rounded-xl p-3 whitespace-pre-wrap leading-relaxed text-slate-700 font-mono overflow-x-auto">
        {value}
      </pre>
    </div>
  );
}

// ─── Download Logic ─────────────────────────────────────────────────────────────
function downloadBlueprint() {
  const content = JSON.stringify(BLUEPRINT, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tailorix-ai-blueprint.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadMarkdown() {
  const md = `# Tailorix AI — Full Blueprint Export
Generated: ${new Date().toLocaleDateString()}

## App Ideology
${BLUEPRINT.meta.ideology}

---

## Database Schema

${BLUEPRINT.entities.map(e => `### ${e.name}\n\`\`\`\n${e.fields}\n\`\`\``).join('\n\n')}

---

## Feature: Fashion Illustrator
**API Used:** ${BLUEPRINT.fashionIllustrator.apiUsed}
**Credit Cost:** ${BLUEPRINT.fashionIllustrator.creditCost}

### AI Prompt Template
\`\`\`
${BLUEPRINT.fashionIllustrator.createPromptTemplate}
\`\`\`

### Freemium Gating
${BLUEPRINT.fashionIllustrator.freemiumGating}

### Save Logic
${BLUEPRINT.fashionIllustrator.saveLogic}

---

## Feature: Garment Deconstruct
**Steps:** ${BLUEPRINT.garmentDeconstruct.steps.join('\n')}

### Analysis Prompt
\`\`\`
${BLUEPRINT.garmentDeconstruct.analysisPrompt}
\`\`\`

### Illustration Prompt
\`\`\`
${BLUEPRINT.garmentDeconstruct.illustrationPrompt}
\`\`\`

### Pattern Board Prompt
\`\`\`
${BLUEPRINT.garmentDeconstruct.patternBoardPrompt}
\`\`\`

---

## Feature: Inspiration Feed
${BLUEPRINT.inspirationFeed.dataFlow}

### Like Logic
${BLUEPRINT.inspirationFeed.likeLogic}

### Comment Logic
${BLUEPRINT.inspirationFeed.commentLogic}

### Remix Logic
${BLUEPRINT.inspirationFeed.remixLogic}

---

## Feature: AI Chat
**Credit Cost:** ${BLUEPRINT.aiChat.creditCost}

### System Prompt
\`\`\`
${BLUEPRINT.aiChat.systemPrompt}
\`\`\`

---

## Feature: User Profile
${BLUEPRINT.userProfile.savedDesignsLogic}

### Theme Logic
${BLUEPRINT.userProfile.themeLogic}

---

## Credit System
### Reset Logic
${BLUEPRINT.creditSystem.resetLogic}

### Deduct Logic
${BLUEPRINT.creditSystem.deductLogic}

### Premium Bypass
${BLUEPRINT.creditSystem.premiumBypass}

---

## Premium Gating
${BLUEPRINT.premiumGating.checkLogic}

---

## Workspace Collaboration
### Roles
${BLUEPRINT.workspaceCollaboration.roles}

### Core Flow
${BLUEPRINT.workspaceCollaboration.coreFlow}

---

## Notification System
### Types
${BLUEPRINT.notifications.notificationTypes}

### Creation Logic
${BLUEPRINT.notifications.creationLogic}

---

## Admin Dashboard
### Access Gate
${BLUEPRINT.adminControl.accessGate}

### Metrics
${BLUEPRINT.adminControl.metricsDisplayed}

### Backend Function
${BLUEPRINT.adminControl.backendFunction}

---

## Help & Support
### Free Topics
${BLUEPRINT.helpAndSupport.freeTopics}

### Pro Topics
${BLUEPRINT.helpAndSupport.proTopics}

### Support Contact
${BLUEPRINT.helpAndSupport.supportContact}
`;

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tailorix-ai-blueprint.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function TailorixBlueprintExport() {
  const sections = [
    {
      key: 'fashionIllustrator',
      title: 'Fashion Illustrator',
      icon: Image,
      color: 'bg-pink-500',
      data: BLUEPRINT.fashionIllustrator,
    },
    {
      key: 'garmentDeconstruct',
      title: 'Garment Deconstruct',
      icon: Scissors,
      color: 'bg-indigo-600',
      data: BLUEPRINT.garmentDeconstruct,
    },
    {
      key: 'inspirationFeed',
      title: 'Inspiration Feed',
      icon: Users,
      color: 'bg-rose-500',
      data: BLUEPRINT.inspirationFeed,
    },
    {
      key: 'aiChat',
      title: 'AI Chat (Tailorix AI)',
      icon: MessageCircle,
      color: 'bg-emerald-600',
      data: BLUEPRINT.aiChat,
    },
    {
      key: 'userProfile',
      title: 'User Profile',
      icon: User,
      color: 'bg-blue-500',
      data: BLUEPRINT.userProfile,
    },
    {
      key: 'helpAndSupport',
      title: 'Help & Support',
      icon: HelpCircle,
      color: 'bg-amber-500',
      data: BLUEPRINT.helpAndSupport,
    },
    {
      key: 'notifications',
      title: 'Notification System',
      icon: FileText,
      color: 'bg-violet-500',
      data: BLUEPRINT.notifications,
    },
    {
      key: 'adminControl',
      title: 'Admin Dashboard',
      icon: Shield,
      color: 'bg-slate-700',
      data: BLUEPRINT.adminControl,
    },
    {
      key: 'creditSystem',
      title: 'Credit System',
      icon: Cpu,
      color: 'bg-orange-500',
      data: BLUEPRINT.creditSystem,
    },
    {
      key: 'workspaceCollaboration',
      title: 'Workspace Collaboration',
      icon: Users,
      color: 'bg-teal-600',
      data: BLUEPRINT.workspaceCollaboration,
    },
    {
      key: 'premiumGating',
      title: 'Freemium / Premium Gating',
      icon: CheckCircle,
      color: 'bg-yellow-600',
      data: BLUEPRINT.premiumGating,
    },
    {
      key: 'entities',
      title: 'Database Schema (All Entities)',
      icon: Database,
      color: 'bg-cyan-600',
      data: null,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-16">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold mb-4">
            <Code className="w-3.5 h-3.5" />
            Architecture Blueprint
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Tailorix AI — Full Blueprint</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Complete logic reference for recreating Tailorix AI on any platform.
            Includes AI prompts, database schemas, feature logic, and freemium gating patterns.
          </p>

          {/* Download Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={downloadMarkdown}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-2"
            >
              <Download className="w-4 h-4" />
              Download .md (Readable)
            </Button>
            <Button
              onClick={downloadBlueprint}
              variant="outline"
              className="rounded-xl gap-2 border-slate-300"
            >
              <FileText className="w-4 h-4" />
              Download .json (Structured)
            </Button>
          </div>
        </motion.div>

        {/* Ideology Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs">💡</span>
            App Ideology
          </h2>
          <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">
            {BLUEPRINT.meta.ideology}
          </pre>
        </div>

        {/* Feature Sections */}
        {sections.map((s) => (
          <Section key={s.key} title={s.title} icon={s.icon} color={s.color}>
            {s.key === 'entities' ? (
              BLUEPRINT.entities.map((e) => (
                <Field key={e.name} label={e.name} value={e.fields} />
              ))
            ) : (
              Object.entries(s.data).map(([key, val]) => (
                <Field
                  key={key}
                  label={key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  value={Array.isArray(val) ? val.join('\n') : String(val)}
                />
              ))
            )}
          </Section>
        ))}

        {/* Footer note */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 leading-relaxed">
          <strong>Reconstruction Tip:</strong> Build in this order on your new platform:
          1. Set up Auth (Supabase Auth / Clerk) →
          2. Create all database tables →
          3. Build Inspiration Feed (no AI needed) →
          4. Build Workspaces (no AI needed) →
          5. Build AI Chat (LLM API call) →
          6. Build Fashion Illustrator (Image Generation API call) →
          7. Build Garment Deconstruct (LLM Vision + Image Generation).
          The AI prompts above are your "Secret Sauce" — copy them exactly.
        </div>
      </div>
    </div>
  );
}