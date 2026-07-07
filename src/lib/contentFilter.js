/**
 * Tailorix Community Content Filter
 * Blocks offensive language, scam patterns, and personal info leaks.
 */

const BLOCKED_WORDS = [
  // English profanity
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'crap', 'dick', 'pussy', 'cock',
  'nigger', 'nigga', 'faggot', 'retard', 'slut', 'whore', 'cunt', 'ass',
  // Nigerian/Pidgin insults & slurs
  'oloshi', 'ode', 'mumu', 'idiot', 'foolish', 'useless', 'stupid', 'dullard',
  'werey', 'olosho', 'ashewo', 'omo ale', 'bastard', 'oshi', 'gbagbe', 'oloriburuku',
  'omoale', 'asewo', 'omoita', 'yahoo', 'scammer', 'ritualist',
  // Spam / external links
  'bet9ja', 'sportybet', 'betway', 'casino', 'gambling', 'lottery', 'win money',
  'click here', 'visit our site', 'free money', 'double your money',
  // Sensitive personal info patterns handled separately (regex)
];

// Regex patterns for sensitive data
const SENSITIVE_PATTERNS = [
  /\b\d{10,11}\b/g,           // Nigerian phone numbers (10-11 digits)
  /\b0[789]\d{9}\b/g,         // Nigerian mobile numbers
  /\b\d{10}\b/g,              // General 10-digit numbers
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Bank card numbers
  /\baccount\s*number\s*:?\s*\d+/gi, // Account number mentions
  /\bbank\s*account\s*:?\s*\d+/gi,
];

const SPAM_URL_PATTERN = /https?:\/\/(?!tailorix\.com|base44\.com)[^\s]+/gi;

/**
 * Check text for violations.
 * Returns { blocked: boolean, reason: string | null }
 */
export function checkContent(text) {
  if (!text) return { blocked: false, reason: null };

  const lower = text.toLowerCase();

  // Check blocked words
  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(`\\b${word.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(lower)) {
      return {
        blocked: true,
        reason: `Your post contains a word ("${word}") that doesn't follow our community tailoring standards.`
      };
    }
  }

  // Check sensitive patterns (phone numbers, bank details)
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) {
      pattern.lastIndex = 0; // reset regex state
      return {
        blocked: true,
        reason: "For your safety, please don't share phone numbers or bank details in the community feed."
      };
    }
  }

  // Check external URLs (spam links)
  if (SPAM_URL_PATTERN.test(text)) {
    SPAM_URL_PATTERN.lastIndex = 0;
    return {
      blocked: true,
      reason: "External links aren't allowed in the community feed. Please keep it about fashion! ✂️"
    };
  }

  return { blocked: false, reason: null };
}