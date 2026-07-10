import React, { useState } from 'react';

interface BoardFilterProps {
  filterPriorities: string[];
  togglePriorityFilter: (priority: string) => void;
  filterLabels: string[];
  availableLabels: string[];
  toggleLabelFilter: (label: string) => void;
}

export const BoardFilter: React.FC<BoardFilterProps> = ({
  filterPriorities,
  togglePriorityFilter,
  filterLabels,
  availableLabels,
  toggleLabelFilter
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        className={`flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium sm:font-normal px-2.5 sm:px-3 py-1.5 rounded-lg border transition-colors min-h-[32px] sm:min-h-[36px] ${(filterPriorities.length > 0 || filterLabels.length > 0) ? 'bg-accent/10 border-accent text-accent' : 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
      >
        <span>Filter</span>
        {(filterPriorities.length > 0 || filterLabels.length > 0) && (
          <span className="bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {filterPriorities.length + filterLabels.length}
          </span>
        )}
      </button>
      
      {isFilterOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl z-50 py-2">
            <div className="px-3 py-1 text-xs font-medium text-text-secondary uppercase tracking-wider">Priority</div>
            {['urgent', 'high', 'normal', 'low'].map(p => (
              <button 
                key={p}
                onClick={() => togglePriorityFilter(p)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface-hover transition-colors"
              >
                <div className={`w-3 h-3 rounded border ${filterPriorities.includes(p) ? 'bg-accent border-accent' : 'border-border'}`} />
                <span className="capitalize">{p}</span>
              </button>
            ))}

            {availableLabels.length > 0 && (
              <>
                <div className="px-3 py-1 mt-2 border-t border-border/50 pt-2 text-xs font-medium text-text-secondary uppercase tracking-wider">Labels</div>
                {availableLabels.map(l => (
                  <button 
                    key={l}
                    onClick={() => toggleLabelFilter(l)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface-hover transition-colors"
                  >
                    <div className={`w-3 h-3 rounded border flex-shrink-0 ${filterLabels.includes(l) ? 'bg-accent border-accent' : 'border-border'}`} />
                    <span className="truncate">{l}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
