/**
 * Platform detection utility for Tailorix AI.
 * Priority: window.APP_PLATFORM (injected by native wrapper) → hostname → default "web"
 *
 * Values: "amazon" | "playstore" | "web"
 */

export function detectPlatform() {
  if (typeof window === 'undefined') return 'web';

  // Native wrapper sets this before React loads
  if (window.APP_PLATFORM) {
    return window.APP_PLATFORM; // "amazon" | "playstore" | "web"
  }

  const host = window.location.hostname || '';
  const ua = navigator.userAgent || '';

  // Amazon detection: native wrapper injects APP_PLATFORM, or Fire tablet UA, or AmazonWebView
  if (
    host.includes('amazon') ||
    ua.includes('AmazonWebView') ||
    ua.includes('AMZN_') ||          // Fire tablet UA prefix
    ua.includes('Silk/') ||           // Amazon Silk browser
    ua.includes('Kf') ||              // Amazon Kindle Fire UA
    typeof window.AmazonIAP !== 'undefined'  // Native IAP bridge present
  ) {
    return 'amazon';
  }

  return 'web';
}

export const PLATFORM = detectPlatform();

// Convenience booleans
export const IS_AMAZON = PLATFORM === 'amazon';
export const IS_PLAYSTORE = PLATFORM === 'playstore';
export const IS_WEB = PLATFORM === 'web';