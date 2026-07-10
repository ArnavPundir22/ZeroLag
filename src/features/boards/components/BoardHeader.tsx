import React from 'react';
import { Menu, RefreshCw, AlertTriangle, CheckCircle2, Share2, Calendar as CalendarIcon, Layout, Video, Plus } from 'lucide-react';
import { BoardFilter } from './BoardFilter';

interface BoardHeaderProps {
  boardTitle: string;
  tempTitle: string;
  setTempTitle: (title: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (isEditing: boolean) => void;
  handleRenameSubmit: () => void;
  viewMode: 'board' | 'calendar';
  setViewMode: (mode: 'board' | 'calendar') => void;
  filterPriorities: string[];
  togglePriorityFilter: (priority: string) => void;
  filterLabels: string[];
  availableLabels: string[];
  toggleLabelFilter: (label: string) => void;
  user: any;
  onlineUsers: Record<string, any>;
  isOffline: boolean;
  syncStatus: string;
  handleMeetClick: () => void;
  handleShare: () => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  handleAddColumn: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  boardTitle, tempTitle, setTempTitle, isEditingTitle, setIsEditingTitle, handleRenameSubmit,
  viewMode, setViewMode, filterPriorities, togglePriorityFilter, filterLabels, availableLabels, toggleLabelFilter,
  user, onlineUsers, isOffline, syncStatus, handleMeetClick, handleShare, setIsSidebarOpen, handleAddColumn
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:h-14 sm:items-center justify-between shrink-0 bg-background/80 backdrop-blur-md z-10 relative border-b border-border">
      {/* Top Row: Title, Menu, and basic status */}
      <div className="flex items-center justify-between h-14 px-3 sm:px-8 w-full sm:w-auto">
        <div className="flex items-center gap-1 sm:gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-1.5 -ml-1.5 text-text-secondary hover:text-text-primary rounded-md hover:bg-surface-hover flex items-center justify-center min-w-[32px]"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
              autoFocus
              className="font-medium text-text-primary bg-background border border-accent rounded px-2 py-0.5 max-w-[120px] sm:max-w-[200px] md:max-w-xs leading-none outline-none focus:ring-2 focus:ring-accent/50"
            />
          ) : (
            <h2 
              onClick={() => {
                setTempTitle(boardTitle);
                setIsEditingTitle(true);
              }}
              title="Click to rename"
              className="font-medium text-text-primary truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs leading-none cursor-pointer hover:bg-surface-hover hover:ring-1 hover:ring-border px-2 py-1 rounded transition-all"
            >
              {boardTitle}
            </h2>
          )}

          <div className="hidden sm:block h-4 w-px bg-border mx-2" />

          {/* Desktop View Switcher & Filter */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex p-1 bg-black/20 border border-white/5 rounded-lg mr-2">
              <button
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${viewMode === 'board' ? 'bg-surface text-white shadow' : 'text-text-secondary hover:text-white'}`}
              >
                <Layout className="w-3.5 h-3.5" /> Board
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-surface text-white shadow' : 'text-text-secondary hover:text-white'}`}
              >
                <CalendarIcon className="w-3.5 h-3.5" /> Calendar
              </button>
            </div>

            <BoardFilter 
              filterPriorities={filterPriorities}
              togglePriorityFilter={togglePriorityFilter}
              filterLabels={filterLabels}
              availableLabels={availableLabels}
              toggleLabelFilter={toggleLabelFilter}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-4 text-sm relative">
          {/* Desktop Avatars */}
          <div className="hidden md:flex items-center -space-x-2 mr-2">
            {user && (
              <div 
                title={`${user.fullName || user.firstName || 'You'} (You)`}
                className="w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-xs font-bold text-white shadow-md relative group z-30 bg-accent"
              >
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt="You" className="w-full h-full rounded-full object-cover" />
                ) : (
                  (user.fullName || user.firstName || 'Y').substring(0, 2).toUpperCase()
                )}
              </div>
            )}
            {Object.values(onlineUsers).slice(0, 4).map((u: any) => (
              <div 
                key={u.id} 
                title={u.name}
                className="w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-xs font-bold text-white shadow-md relative group z-20"
                style={{ backgroundColor: u.color }}
              >
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={u.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  u.name.substring(0, 2).toUpperCase()
                )}
              </div>
            ))}
            {Object.values(onlineUsers).length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-hover flex items-center justify-center text-[10px] font-bold text-text-secondary z-10">
                +{Object.values(onlineUsers).length - 4}
              </div>
            )}
          </div>

          <div className={`flex items-center justify-center sm:justify-start gap-2 p-1.5 sm:px-3 sm:py-1.5 min-w-[32px] sm:min-w-[auto] min-h-[32px] sm:min-h-[36px] rounded-full border transition-colors ${
            isOffline 
              ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' 
              : syncStatus === 'syncing'
                ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                : syncStatus === 'error'
                  ? 'border-red-500/30 text-red-400 bg-red-500/10'
                  : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
          }`}>
            {isOffline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                <span className="hidden sm:inline">Offline</span>
              </>
            ) : syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Syncing</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Error</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Synced</span>
              </>
            )}
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handleAddColumn}
              className="flex items-center justify-center min-w-[36px] min-h-[36px] gap-2 px-3 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm"
              title="Add Custom Phase"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Phase</span>
            </button>
            <button
              onClick={handleMeetClick}
              className="flex items-center justify-center min-w-[36px] min-h-[36px] gap-2 px-3 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
              title="Start Video Meeting"
            >
              <Video className="w-4 h-4" />
              <span className="font-medium">Meet</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center min-w-[36px] min-h-[36px] gap-2 px-3 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
              title="Refresh App"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="font-medium">Refresh</span>
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center justify-center min-w-[36px] min-h-[36px] gap-2 px-3 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
              title="Share Project"
            >
              <Share2 className="w-4 h-4" />
              <span className="font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Secondary Row: Tools & Actions */}
      <div className="sm:hidden flex items-center justify-between px-3 pb-3 gap-2 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex p-1 bg-black/20 border border-white/5 rounded-lg">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'board' ? 'bg-surface text-white shadow' : 'text-text-secondary hover:text-white'}`}
            >
              <Layout className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-surface text-white shadow' : 'text-text-secondary hover:text-white'}`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>
          
          <BoardFilter 
            filterPriorities={filterPriorities}
            togglePriorityFilter={togglePriorityFilter}
            filterLabels={filterLabels}
            availableLabels={availableLabels}
            toggleLabelFilter={toggleLabelFilter}
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            onClick={handleAddColumn}
            className="flex items-center justify-center min-w-[32px] min-h-[32px] p-1.5 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm"
            title="Add Custom Phase"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleMeetClick}
            className="flex items-center justify-center min-w-[32px] min-h-[32px] p-1.5 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="Start Video Meeting"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center min-w-[32px] min-h-[32px] p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            title="Refresh App"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center justify-center min-w-[32px] min-h-[32px] p-1.5 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
            title="Share Project"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
