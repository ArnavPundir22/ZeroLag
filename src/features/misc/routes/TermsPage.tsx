import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <ShieldCheck className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-text-primary">Terms and Conditions</h1>
        </div>
        <div className="space-y-6 text-text-secondary leading-relaxed">
          <p>
            Welcome to ZeroLag. By accessing or using our platform, you agree to be bound by these Terms and Conditions.
          </p>
          
          <h2 className="text-xl font-semibold text-text-primary mt-8">1. Acceptance of Terms</h2>
          <p>
            By creating an account and using ZeroLag, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2 className="text-xl font-semibold text-text-primary mt-8">2. Use License</h2>
          <p>
            Permission is granted to temporarily use the materials and features on ZeroLag for personal, non-commercial, and commercial project management. This is the grant of a license, not a transfer of title.
          </p>

          <h2 className="text-xl font-semibold text-text-primary mt-8">3. User Data and Privacy</h2>
          <p>
            ZeroLag is a local-first application. While we sync data to the cloud for backup and collaboration, you are responsible for the data you store. We will not sell or misuse your data. For more details, please review our Privacy Policy.
          </p>

          <h2 className="text-xl font-semibold text-text-primary mt-8">4. Limitations</h2>
          <p>
            In no event shall ZeroLag or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the platform.
          </p>
          
          <p className="text-sm italic mt-12 opacity-50">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};
