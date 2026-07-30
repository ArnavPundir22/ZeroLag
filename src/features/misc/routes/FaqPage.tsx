import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const faqs = [
    {
      q: "What does 'Local-First' mean for ZeroLag?",
      a: "Traditional web apps make you wait for a server response on every action. ZeroLag reads and writes data directly to a local database (IndexedDB) inside your browser. All mutations occur instantly with 0ms latency, and a background sync engine handles saving changes to the cloud database when you have an internet connection."
    },
    {
      q: "Does the app work completely offline?",
      a: "Yes, 100%. You can create, drag-and-drop, edit, and comment on tasks without internet access. The sync engine tracks all operations locally as 'PENDING' and automatically pushes them to Supabase the moment your device reconnects."
    },
    {
      q: "How do push notifications work when the app is closed?",
      a: "ZeroLag utilizes the Web Push API and background Service Workers. When you grant notification permissions, your browser creates a secure subscription token. If a collaborator makes a change (like assigning you a task or posting a comment), the Vercel backend sends an encrypted notification through your browser's push service (Google Firebase for Chrome, Apple Push Notification service for Safari), which your Service Worker receives and displays even if the browser tab is closed."
    },
    {
      q: "How do I configure and enable Push Notifications on mobile/iOS?",
      a: "Mobile operating systems require Progressive Web Apps (PWAs) to be installed before they can receive push alerts. First, tap 'Share' in Safari (iOS) or the menu in Chrome (Android) and select 'Add to Home Screen'. Open the installed app, go to Settings, and tap 'Always-on Push Notifications'."
    },
    {
      q: "How are conflicts resolved if two users edit the same task offline?",
      a: "We use an event-sourced operational logging strategy. Each mutation is stored as a sequential operation with a timestamp. When clients sync, they apply operations in strict order. The latest timestamp for any field takes precedence, ensuring all databases merge to a matching state."
    },
    {
      q: "Is my data secure on the cloud database?",
      a: "Absolutely. We secure database read/writes using Row-Level Security (RLS) policies on Supabase. Only authenticated users with explicit access (via the board_access junction table) can sync or query a board's operations. Your authentication is securely managed by Clerk."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <HelpCircle className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-text-primary font-outfit">Frequently Asked Questions</h1>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx} 
                onClick={() => toggleFaq(idx)}
                className={`bg-surface p-6 rounded-2xl border transition-all cursor-pointer ${
                  isOpen ? 'border-accent/40 bg-surface-hover/20' : 'border-border hover:bg-surface-hover/50'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base font-bold text-text-primary">{faq.q}</h3>
                  <button className="text-text-secondary hover:text-accent">
                    {isOpen ? <ChevronUp className="w-5 h-5 text-accent" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
                {isOpen && (
                  <p className="text-sm text-text-secondary mt-3 leading-relaxed border-t border-border/10 pt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
