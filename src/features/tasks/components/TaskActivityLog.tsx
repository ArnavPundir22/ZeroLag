import React from 'react';
import { Clock, Plus, Trash2, Edit3, Paperclip, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskActivityLogProps {
  activities: any[];
}

export const TaskActivityLog: React.FC<TaskActivityLogProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary flex flex-col items-center justify-center">
        <Clock className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-sm">No activity recorded yet.</p>
        <p className="text-xs opacity-50 mt-1">Changes to this task will appear here.</p>
      </div>
    );
  }

  const getIcon = (type: string, desc: string) => {
    if (type === 'uploaded' || desc.includes('file')) return <Paperclip className="w-3.5 h-3.5 text-blue-400" />;
    if (type === 'deleted' || desc.includes('Removed')) return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
    if (desc.includes('Completed') || desc.includes('Done')) return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
    if (type === 'created') return <Plus className="w-3.5 h-3.5 text-emerald-400" />;
    return <Edit3 className="w-3.5 h-3.5 text-accent" />;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="p-6">
      <div className="relative border-l-2 border-border/50 ml-3 space-y-6">
        {activities.map((activity, index) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            key={activity.id} 
            className="relative pl-6"
          >
            {/* Timeline Dot */}
            <div className="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-surface border-2 border-border flex items-center justify-center shadow-sm">
              {getIcon(activity.type, activity.description)}
            </div>
            
            {/* Content */}
            <div className="bg-surface/50 border border-white/5 rounded-xl p-3 shadow-soft-sm">
              <p className="text-sm text-text-primary font-medium">{activity.description}</p>
              <p className="text-xs text-text-secondary mt-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {formatTime(activity.timestamp)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
