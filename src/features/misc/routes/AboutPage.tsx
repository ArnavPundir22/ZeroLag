import React from 'react';
import { Info } from 'lucide-react';

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
        </div>
      </div>
    </div>
  );
};
