import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { UploadCloud, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUser, useSession } from '@clerk/react';
import { parseTimetableImage } from '../../utils/aiTimetableParser';
import { importDynamicTimetable } from '../../utils/importTimetable';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store';

interface AIMagicImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIMagicImportModal: React.FC<AIMagicImportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const { session } = useSession();
  const [isDragging, setIsDragging] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setIsSidebarOpen = useAppStore(state => state.setIsSidebarOpen);

  const loadingMessages = [
    "Analyzing image with AI...",
    "Extracting timetable data...",
    "Structuring columns and rows...",
    "Building Kanban board...",
    "Almost there..."
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAiLoading) {
      interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isAiLoading]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setIsAiLoading(false);
      setIsDragging(false);
    }
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    if (!user || !session) return;
    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file.");
      return;
    }

    try {
      setError(null);
      setIsAiLoading(true);
      const token = (await session.getToken()) || '';
      const timetableData = await parseTimetableImage(file, token);
      
      if (timetableData && timetableData.length > 0) {
        const result = await importDynamicTimetable(user.id, timetableData);
        if (result) {
          setSuccess(true);
          setTimeout(() => {
            onClose();
            setIsSidebarOpen(false);
          }, 1500);
        } else {
          setError("Failed to create timetable in the database.");
        }
      } else {
        setError('AI could not extract a valid timetable schedule from this image.');
      }
    } catch (err: any) {
      setError(err.message || "Failed to process image.");
    } finally {
      setIsAiLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !isAiLoading && onClose()} title="AI Magic Import">
      <div className="flex flex-col items-center">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Import Successful!</h3>
              <p className="text-text-secondary text-center text-sm">Your timetable has been created and is ready to use.</p>
            </motion.div>
          ) : isAiLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-12 w-full"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 rounded-full border-2 border-blue-500/30 border-t-blue-500 border-r-blue-400 flex items-center justify-center bg-surface relative z-10"
                >
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </motion.div>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMessageIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-text-primary font-medium text-center h-6"
                >
                  {loadingMessages[loadingMessageIndex]}
                </motion.p>
              </AnimatePresence>
              <p className="text-text-secondary text-xs mt-2">This may take up to 20 seconds.</p>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <p className="text-text-secondary text-sm mb-4 text-center">
                Upload a screenshot or photo of any timetable. Our AI will automatically extract the schedule and create a customized Kanban board.
              </p>
              
              <div
                className={`relative group border-2 border-dashed rounded-2xl p-8 transition-all duration-200 cursor-pointer overflow-hidden ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : error 
                    ? 'border-red-500/50 bg-red-500/5'
                    : 'border-border hover:border-accent/50 hover:bg-surface-hover/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Background glow effect on hover/drag */}
                <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 transition-opacity duration-300 ${isDragging ? 'opacity-20' : 'group-hover:opacity-10'}`} />

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                <div className="flex flex-col items-center justify-center text-center relative z-10">
                  <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-blue-500/20 text-blue-400' : 'bg-surface text-text-secondary group-hover:text-accent group-hover:bg-accent/10 shadow-sm border border-border/50'}`}>
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  
                  <h4 className="text-text-primary font-medium mb-1">
                    {isDragging ? 'Drop image here...' : 'Click or drag image to upload'}
                  </h4>
                  <p className="text-text-secondary text-xs">
                    Supports PNG, JPG, JPEG, WEBP
                  </p>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};
