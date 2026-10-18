import React, { useState } from 'react';
import {
  FolderKanban,
  ExternalLink,
  Pencil,
  Save,
  Download,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Check,
  X,
  Link as LinkIcon
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { BatchFolder, CircularNotice, UserProfile } from '../types';

interface DriveHubProps {
  batchFolders: BatchFolder[];
  notices: CircularNotice[];
  currentUser: UserProfile;
  onUpdateFolderUrl: (folderId: string, newUrl: string) => void;
  onUpdateFolderDetails?: (folderId: string, updates: Partial<BatchFolder>) => void;
  onAddFolder?: (newFolder: BatchFolder) => void;
  onDeleteFolder?: (folderId: string) => void;
}

export const DriveHub: React.FC<DriveHubProps> = ({
  batchFolders,
  notices,
  currentUser,
  onUpdateFolderUrl,
  onUpdateFolderDetails,
  onAddFolder,
  onDeleteFolder
}) => {
  // Modal Edit state
  const [editingFolder, setEditingFolder] = useState<BatchFolder | null>(null);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);
  const [editBatchName, setEditBatchName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('FOUNDATION');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editDriveUrl, setEditDriveUrl] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  const handleStartEdit = (folder: BatchFolder) => {
    setEditingFolder(folder);
    setIsAddMode(false);
    setEditBatchName(folder.batchName);
    setEditCategory(folder.category);
    setEditDescription(folder.description);
    setEditDriveUrl(folder.driveUrl);
  };

  const handleStartAdd = () => {
    setEditingFolder(null);
    setIsAddMode(true);
    setEditBatchName('');
    setEditCategory('FOUNDATION');
    setEditDescription('');
    setEditDriveUrl('https://drive.google.com/drive/folders/narayana-prodigy');
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBatchName.trim()) return;

    if (isAddMode && onAddFolder) {
      const newFolder: BatchFolder = {
        id: `folder-${Date.now()}`,
        batchName: editBatchName.trim(),
        category: editCategory.toUpperCase(),
        description: editDescription.trim() || 'Curated Batch materials, DPP solutions and whiteboard notes.',
        driveUrl: editDriveUrl.trim() || 'https://drive.google.com',
        iconType: 'srg',
        iconColor: '#38bdf8',
        chipColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        lastUpdated: 'Just now',
        resourceTypes: ['Whiteboard Notes', 'DPP Solutions', 'PYQs']
      };
      onAddFolder(newFolder);
      setSuccessToast(`Drive folder "${newFolder.batchName}" created successfully!`);
    } else if (editingFolder) {
      if (onUpdateFolderDetails) {
        onUpdateFolderDetails(editingFolder.id, {
          batchName: editBatchName.trim(),
          category: editCategory.toUpperCase(),
          description: editDescription.trim(),
          driveUrl: editDriveUrl.trim()
        });
      } else {
        onUpdateFolderUrl(editingFolder.id, editDriveUrl.trim());
      }
      setSuccessToast(`Drive repository "${editBatchName.trim()}" updated successfully!`);
    }

    setEditingFolder(null);
    setIsAddMode(false);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete Drive repository "${name}"?`)) {
      if (onDeleteFolder) {
        onDeleteFolder(id);
      }
    }
  };

  const renderBatchSVGIcon = (type: BatchFolder['iconType'], color: string) => {
    switch (type) {
      case 'roots':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 20h10" />
            <path d="M12 20v-8" />
            <path d="M12 12a5 5 0 0 1 5-5c0 5-5 5-5 5Z" />
            <path d="M12 12a5 5 0 0 0-5-5c0 5 5 5 5 5Z" />
          </svg>
        );
      case 'horizon':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4" />
            <path d="m4.93 10.93 2.83-2.83" />
            <path d="M2 18h20" />
            <path d="M20 18a8 8 0 1 0-16 0" />
          </svg>
        );
      case 'foundation':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="2" y1="20" x2="22" y2="20" />
            <line x1="4" y1="4" x2="20" y2="4" />
            <path d="M6 4v16M10 4v16M14 4v16M18 4v16" />
          </svg>
        );
      case 'target':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        );
      case 'elevate':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
            <polyline points="18 21 12 15 6 21" />
          </svg>
        );
      case 'srg':
      default:
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)" />
            <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 flex flex-col min-h-[calc(100vh-100px)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-orbitron font-extrabold text-xl text-white tracking-wide">
            BATCH RESOURCES & DRIVE HUB
          </h2>
          <p className="font-inter text-slate-400 text-xs mt-1">
            Curated Google Drive batch repositories, whiteboards, PYQs, and editable resource links
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="px-4 py-2 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          <span>Add Resource Link</span>
        </button>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-inter text-xs flex items-center gap-2 animate-in fade-in">
          <Check size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Full Page Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full flex-grow">
        {batchFolders.map((folder) => (
          <GlassCard key={folder.id} className="p-6 flex flex-col justify-between min-h-[220px]">
            <div className="space-y-4">
              {/* Icon & Category Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 shadow-sm">
                  {renderBatchSVGIcon(folder.iconType, folder.iconColor)}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-manrope font-bold text-[10px] uppercase border ${folder.chipColor}`}>
                    {folder.category}
                  </span>
                  {/* Edit Option accessible to manage links and files */}
                  <button
                    onClick={() => handleStartEdit(folder)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-white/10 transition cursor-pointer"
                    title="Edit Drive repository link, batch name & details"
                  >
                    <Pencil size={14} />
                  </button>
                  {onDeleteFolder && (
                    <button
                      onClick={() => handleDelete(folder.id, folder.batchName)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete Drive Link"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="font-grotesk font-extrabold text-base text-white">
                  {folder.batchName}
                </h3>
                <p className="font-inter text-xs text-slate-300 mt-1 leading-relaxed">
                  {folder.description}
                </p>
              </div>

              {/* Resource Categories */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {folder.resourceTypes.map((rt, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-slate-300 font-mono">
                    {rt}
                  </span>
                ))}
              </div>
            </div>

            {/* Link Preview & Launch Drive Action */}
            <div className="pt-4 border-t border-white/[0.08] mt-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="truncate max-w-[200px] text-slate-500">
                  {folder.driveUrl}
                </span>
                <button
                  onClick={() => handleStartEdit(folder)}
                  className="text-sky-400 hover:underline text-[10px] font-manrope font-bold cursor-pointer"
                >
                  Edit Link
                </button>
              </div>

              <a
                href={folder.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600/30 to-[#0072BC]/40 hover:from-sky-600/50 hover:to-[#0072BC]/60 border border-sky-400/30 text-white font-manrope font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm"
              >
                <span>Open Google Drive</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* EDIT / ADD DRIVE REPOSITORY MODAL */}
      {(editingFolder || isAddMode) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <GlassCard className="max-w-md w-full p-6 space-y-5 border-sky-500/40" hover={false}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <FolderKanban size={18} />
                </div>
                <div>
                  <h3 className="font-grotesk font-bold text-base text-white">
                    {isAddMode ? 'Add Batch Resource Hub' : 'Edit Drive & Hub Repository'}
                  </h3>
                  <p className="font-inter text-[11px] text-slate-400">
                    Update link, batch name, or cloud drive URL
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setIsAddMode(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-manrope font-bold text-xs uppercase tracking-wider mb-1">
                  Batch / Folder Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ROOTS BATCH — Class 8"
                  value={editBatchName}
                  onChange={(e) => setEditBatchName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c121e] border border-white/15 text-white font-grotesk font-semibold text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-manrope font-bold text-xs uppercase tracking-wider mb-1">
                  Category Track
                </label>
                <input
                  type="text"
                  placeholder="e.g. FOUNDATION, OLYMPIAD, ADVANCED"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c121e] border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-manrope font-bold text-xs uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Description of syllabus, lecture notes & resources..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c121e] border border-white/15 text-white font-inter text-xs focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-manrope font-bold text-xs uppercase tracking-wider mb-1">
                  Google Drive / Cloud URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/..."
                  value={editDriveUrl}
                  onChange={(e) => setEditDriveUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c121e] border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFolder(null);
                    setIsAddMode(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-manrope font-bold text-xs uppercase transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0072BC] hover:bg-[#005fa3] text-white font-manrope font-bold text-xs uppercase transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{isAddMode ? 'Create Folder' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
