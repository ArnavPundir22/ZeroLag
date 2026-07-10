import React from 'react';
import { MessageSquare, Send } from 'lucide-react';

interface TaskCommentsProps {
  comments: any[];
  currentUserName: string;
  newComment: string;
  setNewComment: (val: string) => void;
  handleAddComment: (e: React.FormEvent) => void;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ comments, currentUserName, newComment, setNewComment, handleAddComment }) => {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 mb-4">
        {comments.map(comment => {
          const isYou = comment.author === 'You' || comment.author === currentUserName;
          return (
            <div key={comment.id} className={`flex gap-3 items-end ${isYou ? 'flex-row-reverse' : ''}`}>
              {!isYou && (
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs shrink-0 uppercase border border-accent/30 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]">
                  {comment.author.slice(0, 2)}
                </div>
              )}
              <div className={`flex flex-col ${isYou ? 'items-end' : 'items-start'} max-w-[85%]`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="font-semibold text-white text-[11px]">{isYou ? 'You' : comment.author}</span>
                  <span className="text-[10px] text-text-secondary">{new Date(comment.createdAt).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                <div className={`p-3 text-sm relative shadow-lg ${isYou ? 'bg-gradient-to-br from-accent to-purple-600 text-white rounded-2xl rounded-br-sm' : 'bg-white/10 border border-white/5 text-white rounded-2xl rounded-bl-sm backdrop-blur-md'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                </div>
              </div>
            </div>
          );
        })}
        {comments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-text-secondary">
            <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm font-medium">No comments yet.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleAddComment} className="mt-auto relative">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Type a message..."
          className="w-full bg-black/40 border border-white/10 rounded-full pl-5 pr-14 py-3.5 text-sm text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-inner transition-all"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-accent text-white p-2.5 rounded-full hover:scale-105 transition-all disabled:opacity-50 shadow-lg shadow-accent/30 flex items-center justify-center"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
};
