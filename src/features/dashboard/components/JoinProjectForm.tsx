import React from 'react';
import { Share2, Loader2 } from 'lucide-react';

interface JoinProjectFormProps {
  handleJoinProject: (e: React.FormEvent) => void;
  joinCode: string;
  setJoinCode: (code: string) => void;
  isJoining: boolean;
  joinError: string;
}

export const JoinProjectForm: React.FC<JoinProjectFormProps> = ({
  handleJoinProject,
  joinCode,
  setJoinCode,
  isJoining,
  joinError
}) => {
  return (
    <section className="bg-surface/50 backdrop-blur-xl border border-border rounded-2xl p-6 max-w-md shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16" />
      <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4 relative z-10">
        <Share2 className="w-5 h-5 text-accent" />
        Join a Project
      </h2>
      <form onSubmit={handleJoinProject} className="flex gap-3 relative z-10">
        <input 
          type="text" 
          value={joinCode}
          onChange={e => setJoinCode(e.target.value)}
          placeholder="Paste Project Code here..."
          className="flex-1 bg-background/50 border border-border focus:border-accent rounded-xl px-4 py-2.5 outline-none text-text-primary text-sm shadow-inner transition-colors"
        />
        <button 
          type="submit"
          disabled={!joinCode.trim() || isJoining}
          className="bg-accent hover:bg-accent-hover text-white font-medium px-5 py-2.5 rounded-xl transition-all text-sm disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-accent/20"
        >
          {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
        </button>
      </form>
      {joinError && <p className="text-red-400 text-xs mt-3 relative z-10">{joinError}</p>}
    </section>
  );
};
