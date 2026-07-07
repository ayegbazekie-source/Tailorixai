// ─── PWA System Bar Config ────────────────────────────────────────────────────
// Inject PWA system bar config as early as possible (before React renders)
// This is the best workaround since manifest.json and index.html are not editable.
(function () {
  // Always start in light mode — PremiumProvider will switch to dark if user is Pro
  localStorage.setItem('theme', 'light');
  document.documentElement.classList.remove('dark');
  document.documentElement.style.setProperty('background-color', '#efefef', 'important');
  document.documentElement.style.colorScheme = 'light';

  // Remove any existing theme-color metas (injected by browser/platform)
  document.querySelectorAll('meta[name="theme-color"]').forEach(el => el.remove());

  const tc = document.createElement('meta');
  tc.name = 'theme-color';
  tc.content = '#efefef';
  document.head.appendChild(tc);

  // Ensure viewport-fit=cover for edge-to-edge
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp && !vp.content.includes('viewport-fit')) {
    vp.content = vp.content + ', viewport-fit=cover';
  }
})();

import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Reviews from './pages/Reviews';
import TermsOfService from './pages/TermsOfService';
import InspirationFeed from './pages/InspirationFeed';
import GuestShowroom from './pages/GuestShowroom';
import AdminDashboard from './pages/AdminDashboard';
import TailorixDeconstruct from './pages/TailorixDeconstruct';
import SupabaseMigration from './pages/SupabaseMigration';
import TailorixBlueprintExport from './pages/TailorixBlueprintExport';

// Bare-minimum component — renders only the ads.txt line, nothing else
const AppAdsTxt = () => {
  React.useEffect(() => {
    // Override the document to look like a plain-text response
    document.title = 'app-ads.txt';
    document.body.style.cssText = 'margin:0;padding:0;background:#fff;font-family:monospace;white-space:pre';
  }, []);
  return (
    <pre style={{ margin: 0, padding: 0, fontFamily: 'monospace', whiteSpace: 'pre', background: '#fff', color: '#000', fontSize: '14px' }}>
      {'google.com, pub-9053391149127134, DIRECT, f08c47fec0942fa0'}
    </pre>
  );
};

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Don't auto-redirect — show GuestShowroom at root, let user choose to log in
      return (
        <Routes>
          <Route path="/" element={<GuestShowroom />} />
          <Route path="/GuestShowroom" element={<GuestShowroom />} />
          <Route path="*" element={<GuestShowroom />} />
        </Routes>
      );
    }
  }

  // New user gate: authenticated but hasn't accepted terms yet → show TermsOfService
  if (isAuthenticated && user && !user.terms_accepted) {
    // Avoid redirect loop if already on TermsOfService
    const onTermsPage = window.location.hash.includes('TermsOfService');
    if (!onTermsPage) {
      return (
        <Routes>
          <Route path="*" element={<LayoutWrapper currentPageName="TermsOfService"><TermsOfService /></LayoutWrapper>} />
        </Routes>
      );
    }
  }

  // Unauthenticated guests — show public showroom at root
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<GuestShowroom />} />
        <Route path="/GuestShowroom" element={<GuestShowroom />} />
        <Route path="*" element={<GuestShowroom />} />
      </Routes>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Reviews" element={<LayoutWrapper currentPageName="Reviews"><Reviews /></LayoutWrapper>} />
      <Route path="/InspirationFeed" element={<LayoutWrapper currentPageName="InspirationFeed"><InspirationFeed /></LayoutWrapper>} />
      <Route path="/GuestShowroom" element={<GuestShowroom />} />
      <Route path="/AdminDashboard" element={<LayoutWrapper currentPageName="AdminDashboard"><AdminDashboard /></LayoutWrapper>} />
      <Route path="/TailorixDeconstruct" element={<LayoutWrapper currentPageName="TailorixDeconstruct"><TailorixDeconstruct /></LayoutWrapper>} />
      <Route path="/SupabaseMigration" element={<SupabaseMigration />} />
      <Route path="/TailorixBlueprintExport" element={<LayoutWrapper currentPageName="TailorixBlueprintExport"><TailorixBlueprintExport /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            {/* Public plain-text route — must be before the auth wrapper */}
            <Route path="/app-ads.txt" element={<AppAdsTxt />} />
            {/* All other routes go through auth */}
            <Route path="*" element={
              <>
                <NavigationTracker />
                <AuthenticatedApp />
              </>
            } />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App