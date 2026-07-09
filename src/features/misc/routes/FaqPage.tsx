import React from 'react';
import { HelpCircle } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const faqs = [
    {
      q: "What does 'local-first' mean?",
      a: "It means the app reads and writes data directly to a local database on your device. This makes the app incredibly fast because it doesn't have to wait for a network request to complete before showing you the result."
    },
    {
      q: "Does ZeroLag work offline?",
      a: "Yes! You can use ZeroLag completely offline. Any changes you make will be saved locally and automatically synced to the cloud once you reconnect to the internet."
    },
    {
      q: "How does real-time collaboration work?",
      a: "When you and your team are online, changes are synced in real-time. We use conflict-free replicated data types (CRDTs) to ensure that even if two people edit the same task at the same time, the data merges seamlessly without errors."
    },
    {
      q: "Is my data secure?",
      a: "Absolutely. We use industry-standard encryption for data at rest and in transit. Your data is synced to secure, private databases."
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <HelpCircle className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-text-primary">Frequently Asked Questions</h1>
        </div>
        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-surface p-6 rounded-xl border border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-2">{faq.q}</h3>
              <p className="text-text-secondary">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
