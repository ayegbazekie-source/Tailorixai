import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
        Scissors, 
        Home, 
        Camera,
        Wand2,
        HelpCircle,
        User,
        Crown,
        Briefcase,
        ArrowLeft,
        Sparkles
      } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PremiumProvider, { usePremium } from '@/components/PremiumProvider';
import { useWorkspaceNotifications } from '@/components/workspace/useWorkspaceNotifications';
import OfflineBanner from '@/components/workspace/OfflineBanner';
import { base44 } from '@/api/base44Client';

// Root tab pages — these are the bottom-nav destinations
const ROOT_TAB_PAGES = new Set(['FreeHome', 'PremiumHome', 'ImageAnalysis', 'FreeDesignIllustrator', 'DesignGenerator', 'AITutor', 'WorkspaceList', 'ProblemSolver', 'FabricVisualizer', 'UserProfile', 'InspirationFeed']);

// Human-readable page titles for the mobile header
const PAGE_TITLES = {
  ImageAnalysis: 'Garment Analysis',
  DesignGenerator: 'AI Design Studio',
  FreeDesignIllustrator: 'Design Illustrator',
  ProblemSolver: 'Problem Solver',
  AITutor: 'Tailorix AI Chat',
  FabricVisualizer: 'Fabric Visualizer',
  UserProfile: 'My Profile',
  WorkspaceList: 'Workspaces',
  WorkspaceDetail: 'Workspace',
  FreeHome: 'Home',
  PremiumHome: 'Home',
  About: 'About',
  Payment: 'Upgrade to Pro',
  PaymentSuccess: 'Payment Success',
  Progress: 'Progress',
  Lessons: 'Lessons',
  LessonDetail: 'Lesson',
};

const scrollCache = {}; // module-level so it persists across renders

function LayoutContent({ children, currentPageName }) {
  const { user: currentUser, isPremiumActive } = usePremium();
  const { isOnline, unreadCount } = useWorkspaceNotifications(currentUser, isPremiumActive);
  const navigate = useNavigate();
  const prevPageRef = useRef(null);
  const isRootTab = ROOT_TAB_PAGES.has(currentPageName);
  // Save scroll position when leaving a tab page, restore when entering one
  useEffect(() => {
    const prev = prevPageRef.current;
    if (prev && ROOT_TAB_PAGES.has(prev)) {
      scrollCache[prev] = window.scrollY;
    }
    if (ROOT_TAB_PAGES.has(currentPageName)) {
      const saved = scrollCache[currentPageName] ?? 0;
      requestAnimationFrame(() => window.scrollTo(0, saved));
    } else {
      window.scrollTo(0, 0);
    }
    prevPageRef.current = currentPageName;
  }, [currentPageName]);

  // Free users are always light — only Pro users can be dark
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (isPremiumActive) return; // premium theme handled by PremiumProvider
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#0f172a';
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#efefef';
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode, isPremiumActive]);

  // Inject PWA system UI meta tags once on mount
  useEffect(() => {
    // --- viewport (edge-to-edge) ---
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');

    // --- theme-color ---
    // Primary (no media query) — Android installed PWA reads this one
    document.querySelectorAll('meta[name="theme-color"]').forEach(el => el.remove());

    const primaryMeta = document.createElement('meta');
    primaryMeta.setAttribute('name', 'theme-color');
    primaryMeta.setAttribute('content', '#0f172a');
    document.head.appendChild(primaryMeta);

    // Media-aware variants (for browsers that support them)
    const darkMeta = document.createElement('meta');
    darkMeta.setAttribute('name', 'theme-color');
    darkMeta.setAttribute('content', '#0f172a');
    darkMeta.setAttribute('media', '(prefers-color-scheme: dark)');
    document.head.appendChild(darkMeta);

    const lightMeta = document.createElement('meta');
    lightMeta.setAttribute('name', 'theme-color');
    lightMeta.setAttribute('content', '#efefef');
    lightMeta.setAttribute('media', '(prefers-color-scheme: light)');
    document.head.appendChild(lightMeta);

    // --- color-scheme ---
    let colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
    if (!colorSchemeMeta) {
      colorSchemeMeta = document.createElement('meta');
      colorSchemeMeta.setAttribute('name', 'color-scheme');
      document.head.appendChild(colorSchemeMeta);
    }
    colorSchemeMeta.setAttribute('content', 'dark light');

    // --- Apple status bar ---
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(appleMeta);
    }
    appleMeta.setAttribute('content', 'black-translucent');

  }, []);

  // Sync theme classes with active theme
  useEffect(() => {
    if (isPremiumActive) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#0f172a';
      document.documentElement.style.colorScheme = 'dark';
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      // Free users are ALWAYS light — no dark mode allowed
      document.documentElement.classList.remove('dark', 'pro-mode');
      document.documentElement.style.backgroundColor = '#efefef';
      document.documentElement.style.colorScheme = 'light';
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isPremiumActive]);

  // System theme listener removed for free users — they start in light mode by default



  // DYNAMIC NAVIGATION: Premium users get premium-only pages
  const baseNavItems = [
    { name: 'Home', icon: Home, page: isPremiumActive ? 'PremiumHome' : 'FreeHome' },
    { name: 'Analyze', icon: Camera, page: 'ImageAnalysis' },
    { name: 'Illustrator', icon: Wand2, page: 'DesignGenerator' },
    { name: 'Feed', icon: Sparkles, page: 'InspirationFeed' },
    { name: 'Problem Solver', icon: HelpCircle, page: 'ProblemSolver' },
    { name: 'Tailorix AI Chat', iconUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697d0c21476d1c06f4d428ff/169a0ecf8_TailorixChat.png', page: 'AITutor' },
    { name: 'Fabric Visualizer', icon: Scissors, page: 'FabricVisualizer' },
    { name: 'Profile', icon: User, page: 'UserProfile' },
  ];

  const premiumNavItems = [
    ...baseNavItems.slice(0, -1),
    { name: 'Workspaces', icon: Briefcase, page: 'WorkspaceList', badge: unreadCount > 0 ? unreadCount : null },
    baseNavItems[baseNavItems.length - 1]
  ];

  const navItems = isPremiumActive 
    ? premiumNavItems 
    : baseNavItems;

  // Hide nav on special pages
  const hideNav = ['SewingSimulator', 'GarmentViewer', 'Landing', 'Payment', 'PaymentSuccess', 'TermsOfService', 'Policy'].includes(currentPageName);
  const showBottomNav = !hideNav && currentUser;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <OfflineBanner isOnline={isOnline} isPremium={isPremiumActive} />
      {/* Non-root pages: back button header for mobile */}
      {!isRootTab && (
        <nav
          className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--nav-bg)] backdrop-blur-lg border-b border-[var(--nav-border)]"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center h-[60px] px-3 gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-[var(--text-secondary)] flex-shrink-0 min-h-[44px] min-w-[44px]"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="text-base font-semibold text-[var(--text-primary)] truncate flex-1">
              {PAGE_TITLES[currentPageName] || currentPageName}
            </span>
          </div>
        </nav>
      )}

      {/* Desktop Navigation (non-home pages) */}
      {!isRootTab && (
        <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-[var(--nav-bg)] backdrop-blur-lg border-b border-[var(--nav-border)]" style={{ paddingTop: 'var(--safe-area-inset-top)' }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697d0c21476d1c06f4d428ff/d87b8f481_TailorixAi.png"
                  alt="Tailorix AI"
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <span className="text-xl font-semibold text-[var(--text-primary)]">
                  {isPremiumActive ? 'Tailorix AI Pro' : 'Tailorix AI'}
                </span>
                {isPremiumActive && <Crown className="w-4 h-4 ml-2 text-amber-400" />}
              </Link>
              <div className="flex items-center gap-1">
                {navItems.map((item) => (
                  <Link key={item.page} to={createPageUrl(item.page)}>
                    <Button
                      variant={currentPageName === item.page ? 'secondary' : 'ghost'}
                      className={`gap-2 rounded-xl relative ${currentPageName === item.page ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      {item.iconUrl ? (
                        <img src={item.iconUrl} alt={item.name} className="w-4 h-4 object-contain" />
                      ) : (
                        <item.icon className="w-4 h-4" />
                      )}
                      {item.name}
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main
        className={`${!isRootTab ? 'md:pt-16' : ''} ${showBottomNav ? 'pb-[calc(env(safe-area-inset-bottom,20px)+64px)]' : ''}`}
        style={{ paddingTop: !isRootTab ? 'calc(env(safe-area-inset-top, 0px) + 60px)' : 'env(safe-area-inset-top, 0px)' }}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {showBottomNav && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--nav-bg)] backdrop-blur-lg border-t border-[var(--border-primary)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
        >
          <div className="flex items-center justify-around px-1 py-1">
            <Link to={createPageUrl(isPremiumActive ? 'PremiumHome' : 'FreeHome')}>
              <Button
                variant="ghost"
                aria-label="Navigate to Home"
                className={`flex flex-col items-center gap-0.5 h-auto py-1.5 px-2 min-h-[44px] min-w-[44px] ${
                  ['Home', 'FreeHome', 'PremiumHome'].includes(currentPageName)
                    ? isPremiumActive ? 'text-[#D4AF37]' : 'text-rose-600 dark:text-rose-400'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <Home className="w-6 h-6" />
                <span className="text-[10px] font-medium">Home</span>
              </Button>
            </Link>
            <Link to={createPageUrl('ImageAnalysis')}>
              <Button
                variant="ghost"
                aria-label="Navigate to Professional Analysis"
                className={`flex flex-col items-center gap-0.5 h-auto py-1.5 px-2 min-h-[44px] min-w-[44px] ${
                  currentPageName === 'ImageAnalysis'
                    ? isPremiumActive ? 'text-[#D4AF37]' : 'text-rose-600 dark:text-rose-400'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <Camera className="w-6 h-6" />
                <span className="text-[10px] font-medium">Analyze</span>
              </Button>
            </Link>
            <Link to={createPageUrl(isPremiumActive ? 'DesignGenerator' : 'FreeDesignIllustrator')}>
              <Button
                variant="ghost"
                aria-label="Navigate to Design Illustrator"
                className={`flex flex-col items-center gap-0.5 h-auto py-1.5 px-2 min-h-[44px] min-w-[44px] ${
                  ['DesignGenerator', 'FreeDesignIllustrator'].includes(currentPageName)
                    ? isPremiumActive ? 'text-[#D4AF37]' : 'text-rose-600 dark:text-rose-400'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <Wand2 className="w-6 h-6" />
                <span className="text-[10px] font-medium">Design</span>
              </Button>
            </Link>
            <Link to={createPageUrl('InspirationFeed')}>
              <Button
                variant="ghost"
                aria-label="Navigate to Inspiration Feed"
                className={`flex flex-col items-center gap-0.5 h-auto py-1.5 px-2 min-h-[44px] min-w-[44px] ${
                  currentPageName === 'InspirationFeed'
                    ? isPremiumActive ? 'text-[#D4AF37]' : 'text-rose-600 dark:text-rose-400'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <Sparkles className="w-6 h-6" />
                <span className="text-[10px] font-medium">Feed</span>
              </Button>
            </Link>
            <Link to={createPageUrl('UserProfile')}>
              <Button
                variant="ghost"
                aria-label="Navigate to User Profile"
                className={`flex flex-col items-center gap-0.5 h-auto py-1.5 px-2 min-h-[44px] min-w-[44px] ${
                  currentPageName === 'UserProfile'
                    ? isPremiumActive ? 'text-[#D4AF37]' : 'text-rose-600 dark:text-rose-400'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <User className="w-6 h-6" />
                <span className="text-[10px] font-medium">Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
      </div>
      );
      }

export default function Layout({ children, currentPageName }) {
  return (
    <PremiumProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </PremiumProvider>
  );
}