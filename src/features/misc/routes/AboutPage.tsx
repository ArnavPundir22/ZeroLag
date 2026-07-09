import React from 'react';
import { Info, GitBranch, ExternalLink } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Info className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold text-text-primary">About ZeroLag</h1>
        </div>
        <div className="space-y-6 text-text-secondary leading-relaxed">
          <p>
            ZeroLag is a local-first project management platform designed to eliminate loading spinners and network latency. The application prioritizes immediate user feedback by persisting all interactions to a local database first, and synchronizing with a remote backend entirely in the background.
          </p>
          <p>
            Our mission is to provide an uninterrupted, lightning-fast experience for individuals and teams looking to organize their tasks, ideas, and projects without ever having to wait for a server response.
          </p>
          <h2 className="text-xl font-semibold text-text-primary mt-8">Core Principles</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Local-First:</strong> Your data lives on your device first. No internet connection? No problem.</li>
            <li><strong>Real-time Collaboration:</strong> See changes from your team instantly when online.</li>
            <li><strong>Privacy & Security:</strong> We leverage modern encryption and decentralized architecture to keep your data safe.</li>
          </ul>

          <h2 className="text-xl font-semibold text-text-primary mt-8">About the Creator</h2>
          <p>
            ZeroLag is developed by <strong>Arnav Pundir</strong>. Passionate about building seamless, high-performance web applications, Arnav created ZeroLag to solve the frustrations of slow, unresponsive project management tools.
          </p>
          <p>
            You can find more of my work on my <a href="https://github.com/ArnavPundir22" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">GitHub</a> or visit my <a href="https://arnavpundir22.github.io" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Portfolio</a>.
          </p>

          <div className="mt-12 bg-surface border border-border rounded-xl p-6 relative overflow-hidden group hover:border-accent/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-accent/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-accent" />
                  Architecture & Source Code
                </h3>
                <p className="text-sm text-text-secondary max-w-lg">
                  Curious about how ZeroLag achieves lightning-fast local-first sync, optimistic UI updates, and real-time collaboration? 
                  Read our full Technical Architecture Document on GitHub.
                </p>
              </div>
              
              <a 
                href="https://github.com/ArnavPundir22/ZeroLag" 
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-background border border-border hover:border-accent hover:text-accent rounded-lg font-medium text-sm transition-all shadow-sm group-hover:shadow-md"
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
