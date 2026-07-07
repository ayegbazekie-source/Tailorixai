import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Policy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-middle)] to-[var(--gradient-end)] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" className="mb-6 text-[var(--text-secondary)] -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        {/* Header */}
        <div className="bg-[var(--card-bg)] rounded-3xl p-8 md:p-12 shadow-lg border border-[var(--card-border)]">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-8 text-center">
            SewSimple Terms & Privacy
          </h1>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="bg-[var(--bg-tertiary)] rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
                Welcome to SewSimple!
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                SewSimple is your AI-powered tailoring and fashion assistant. We're committed to providing 
                you with professional tools while maintaining transparency about our services and your data.
              </p>
            </div>

            <div className="space-y-6">
              <div className="border-l-4 border-rose-500 pl-6 py-2">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Free Access
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Every user gets <strong>3 free AI design generations per month</strong>. This allows you to 
                  explore our Fashion/Design Illustrator feature and see the power of AI-assisted design.
                </p>
              </div>

              <div className="border-l-4 border-amber-500 pl-6 py-2">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Ad-Supported Trials
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  If you run out of free generations, you can watch a short video ad to unlock 
                  <strong> 5 additional trials</strong>. This helps us keep SewSimple accessible to everyone.
                </p>
              </div>

              <div className="border-l-4 border-violet-500 pl-6 py-2">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Premium Subscription
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Upgrade to <strong>Premium</strong> for unlimited designs, no ads, and high-resolution exports. 
                  Perfect for professional tailors and fashion designers who need unrestricted access to our tools.
                </p>
              </div>

              <div className="border-l-4 border-emerald-500 pl-6 py-2">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                  Your Data & Privacy
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  We use your uploaded images <strong>only to generate your fashion illustrations</strong>. 
                  Your images are not stored permanently, shared with third parties, or used for any purpose 
                  other than providing you with the requested service. We respect your privacy and creative work.
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <p className="text-sm text-[var(--text-secondary)] text-center">
                By using SewSimple, you agree to these terms. If you have questions or concerns, 
                please contact our support team.
              </p>
              <p className="text-xs text-[var(--text-tertiary)] text-center mt-2">
                Last updated: February 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}