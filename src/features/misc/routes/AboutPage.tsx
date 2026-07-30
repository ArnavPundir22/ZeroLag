import React from 'react';
import { Info, GitBranch, ExternalLink, Cpu, Zap, Lock, Code } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Info className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-text-primary font-outfit">About ZeroLag</h1>
        </div>
        <div className="space-y-6 text-text-secondary leading-relaxed text-sm">
          <p className="text-base text-text-primary">
            ZeroLag is a state-of-the-art, local-first project management platform engineered to solve the speed and reliability problems of modern web applications.
          </p>
          <p>
            By storing data locally and syncing in the background, ZeroLag completely eliminates loading spinners, network latency, and offline disconnect issues. The app provides a fluid, responsive experience that remains identical whether you have a blazing-fast gigabit connection or no internet at all.
          </p>

          <h2 className="text-xl font-semibold text-text-primary mt-8">Technical Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="border border-border bg-surface p-5 rounded-2xl flex gap-3">
              <Zap className="w-6 h-6 text-accent shrink-0" />
              <div>
                <h4 className="font-bold text-text-primary text-sm mb-1">Local-First Execution</h4>
                <p className="text-xs text-text-secondary">Persistent local storage using RxDB and IndexedDB guarantees immediate 0ms UI response to all modifications.</p>
              </div>
            </div>
            <div className="border border-border bg-surface p-5 rounded-2xl flex gap-3">
              <Cpu className="w-6 h-6 text-accent shrink-0" />
              <div>
                <h4 className="font-bold text-text-primary text-sm mb-1">Real-Time Sync Engine</h4>
                <p className="text-xs text-text-secondary">Custom synchronization protocols with Supabase automatically handle data reconciliations and WebSocket presence updates.</p>
              </div>
            </div>
            <div className="border border-border bg-surface p-5 rounded-2xl flex gap-3">
              <Lock className="w-6 h-6 text-accent shrink-0" />
              <div>
                <h4 className="font-bold text-text-primary text-sm mb-1">Edge Authentication</h4>
                <p className="text-xs text-text-secondary">Secured by Clerk JWT templates, mapped directly to PostgreSQL Row-Level Security (RLS) policies for cryptographic isolation.</p>
              </div>
            </div>
            <div className="border border-border bg-surface p-5 rounded-2xl flex gap-3">
              <Code className="w-6 h-6 text-accent shrink-0" />
              <div>
                <h4 className="font-bold text-text-primary text-sm mb-1">Background Web Push</h4>
                <p className="text-xs text-text-secondary">W3C Web Push with VAPID key signing delivers background task notifications using Vercel Serverless triggers.</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-text-primary mt-8">Meet the Creator</h2>
          <p>
            ZeroLag was envisioned and built by <strong>Arnav Pundir</strong>. Frustrated by standard Kanban apps failing in areas of poor reception, Arnav designed ZeroLag to prove that web apps can feel just as snappy, robust, and permanent as native desktop software.
          </p>
          <p>
            You can explore more projects on my <a href="https://github.com/ArnavPundir22" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">GitHub</a> or check out my <a href="https://arnavpundir22.github.io" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Portfolio</a>.
          </p>

          <div className="mt-12 bg-surface border border-border rounded-xl p-6 relative overflow-hidden group hover:border-accent/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-accent/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-accent" />
                  Open Source Code & Specifications
                </h3>
                <p className="text-sm text-text-secondary max-w-lg">
                  Curious about the implementation details of the optimistic sync pipelines, CRDTs, or service worker assets caching? Review the complete source code on GitHub.
                </p>
              </div>
              
              <a 
                href="https://github.com/ArnavPundir22/ZeroLag" 
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-background border border-border hover:border-accent hover:text-accent rounded-lg font-semibold text-sm transition-all shadow-sm group-hover:shadow-md cursor-pointer"
              >
                View Repository
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
