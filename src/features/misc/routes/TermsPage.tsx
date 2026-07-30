import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <ShieldCheck className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-text-primary">Terms of Service</h1>
        </div>
        <div className="space-y-6 text-text-secondary leading-relaxed text-sm">
          <p className="text-base text-text-primary">
            Welcome to ZeroLag. Please read these Terms of Service ("Agreement") carefully before using our local-first collaborative task management application ("Service").
          </p>

          <h2 className="text-lg font-semibold text-text-primary mt-8">1. Acceptance of Terms</h2>
          <p>
            By creating an account, registering via Clerk, or utilizing the Service, you signify your irrevocable consent to be bound by these Terms of Service. If you do not agree to all terms outlined herein, you must immediately cease usage of the Service.
          </p>

          <h2 className="text-lg font-semibold text-text-primary mt-8">2. Scope of Service & Local-First Architecture</h2>
          <p>
            ZeroLag operates under a **Local-First Architecture**. Your project documents, tasks, comments, and configurations are stored directly on your physical device using browser-based IndexedDB (via RxDB). 
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Offline Capability:</strong> The Service operates independently of network connectivity, queueing all operations locally.</li>
            <li><strong>Synchronization:</strong> When a network connection is detected, local operations are reconciled with a cloud database (Supabase) and broadcast to authorized collaborators.</li>
            <li><strong>Responsibility:</strong> While cloud backups are maintained, you are responsible for maintaining device security to prevent unauthorized access to local database files.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary mt-8">3. Web Push & Device Notifications Policy</h2>
          <p>
            The Service implements the W3C Web Push Protocol to deliver real-time collaboration alerts (such as task assignments, comments, and chat messages) even when the application is closed.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Consent:</strong> Activating "Always-on Push Notifications" grants the Service permission to generate cryptographic credentials (VAPID key tokens) on your device.</li>
            <li><strong>Data Sync:</strong> The generated browser subscription payloads are securely synced to our databases for notification routing purposes. You may revoke this permission at any time via your browser settings.</li>
          </ul>

          <h2 className="text-lg font-semibold text-text-primary mt-8">4. Intellectual Property</h2>
          <p>
            All code, UI designs, brand marks, and technical systems (excluding open-source libraries used under their respective licenses) are the intellectual property of Arnav Pundir. Unauthorized reproduction or resale of the ZeroLag application or assets is strictly prohibited.
          </p>

          <h2 className="text-lg font-semibold text-text-primary mt-8">5. Disclaimers & Limitation of Liability</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. In no event shall ZeroLag, its creator Arnav Pundir, or its cloud providers be liable for any special, incidental, indirect, or consequential damages (including, without limitation, damages for loss of data, profit, or due to business interruption) arising out of the use or inability to use the platform.
          </p>

          <p className="text-xs italic mt-12 opacity-50">
            Last updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
};
