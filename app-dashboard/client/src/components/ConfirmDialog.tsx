/**
 * Confirm Dialog Component
 * Generic confirmation dialog for destructive actions
 */

import { AlertTriangle } from 'lucide-react';
import { useUIStore, useDataStore } from '../hooks/useStore';
import { deleteApplication, deleteAppIdea, deleteGlobalIdea } from '../services/api';
import toast from 'react-hot-toast';

export default function ConfirmDialog() {
  const { closeConfirmDelete, deleteTarget, isRTL } = useUIStore();
  const { removeApplication, removeGlobalIdea } = useDataStore();

  if (!deleteTarget) return null;

  const handleConfirm = async () => {
    const { id, type } = deleteTarget;

    try {
      let response;

      switch (type) {
        case 'app':
          response = await deleteApplication(id);
          if (response.success) {
            removeApplication(id);
            toast.success(isRTL ? 'האפליקציה נמחקה' : 'Application deleted');
          }
          break;

        case 'idea':
          response = await deleteAppIdea(id);
          if (response.success) {
            // Note: We'd need the appId here for proper cleanup
            // For now, the UI should handle refreshing
            toast.success(isRTL ? 'הרעיון נמחק' : 'Idea deleted');
          }
          break;

        case 'globalIdea':
          response = await deleteGlobalIdea(id);
          if (response.success) {
            removeGlobalIdea(id);
            toast.success(isRTL ? 'הרעיון נמחק' : 'Idea deleted');
          }
          break;
      }

      if (response && !response.success) {
        toast.error(response.error || 'Failed to delete');
      }
    } catch {
      toast.error('An error occurred');
    }

    closeConfirmDelete();
  };

  const getTitle = () => {
    switch (deleteTarget.type) {
      case 'app':
        return isRTL ? 'מחיקת אפליקציה' : 'Delete Application';
      case 'idea':
      case 'globalIdea':
        return isRTL ? 'מחיקת רעיון' : 'Delete Idea';
      default:
        return isRTL ? 'מחיקה' : 'Delete';
    }
  };

  const getMessage = () => {
    switch (deleteTarget.type) {
      case 'app':
        return isRTL
          ? 'האם אתה בטוח שברצונך למחוק את האפליקציה הזו? כל ההערות, הרעיונות והיסטוריית הפרומפטים ימחקו גם הם.'
          : 'Are you sure you want to delete this application? All notes, ideas, and prompt history will also be deleted.';
      case 'idea':
      case 'globalIdea':
        return isRTL
          ? 'האם אתה בטוח שברצונך למחוק את הרעיון הזה?'
          : 'Are you sure you want to delete this idea?';
      default:
        return isRTL
          ? 'האם אתה בטוח שברצונך למחוק פריט זה?'
          : 'Are you sure you want to delete this item?';
    }
  };

  return (
    <div className="modal-overlay" onClick={closeConfirmDelete}>
      <div
        className="modal-content w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getTitle()}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {getMessage()}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeConfirmDelete} className="btn-secondary">
              {isRTL ? 'ביטול' : 'Cancel'}
            </button>
            <button onClick={handleConfirm} className="btn-danger">
              {isRTL ? 'מחק' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
