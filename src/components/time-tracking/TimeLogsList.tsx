import React, { useState } from 'react';
import { Edit2, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { useToast } from '@/hooks/use-toast';
import { formatDuration } from '@/lib/helper';

export interface TimeLog {
  _id: string;
  userId: { _id: string; firstName: string; lastName: string; profilePicture?: string };
  workItemId: string;
  timeSpent: number; // in minutes
  logDate: string;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  isOwner?: boolean;
  canEdit?: boolean;
}

export interface TimeLogsListProps {
  logs: TimeLog[];
  isLoading?: boolean;
  onLogDeleted?: (logId: string) => void;
  onLogUpdated?: (logId: string) => void;
  currentUserId?: string;
}

/**
 * Time Logs List Component
 * Displays all time logs for an issue with edit/delete options
 */
export const TimeLogsList: React.FC<TimeLogsListProps> = ({
  logs,
  isLoading,
  onLogDeleted,
  onLogUpdated,
  currentUserId,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ timeSpent: string; comment: string }>({ timeSpent: '', comment: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const startEdit = (log: TimeLog) => {
    setEditingId(log._id);
    setEditData({
      timeSpent: String(log.timeSpent / 60), // convert to hours
      comment: log.comment || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ timeSpent: '', comment: '' });
  };

  const saveEdit = async (logId: string) => {
    try {
      setLoading(true);
      const timeSpentMinutes = parseFloat(editData.timeSpent) * 60;
      if (timeSpentMinutes <= 0) {
        toast({ variant: 'destructive', description: 'Time must be greater than 0' });
        return;
      }

      await issueApiService.updateTimeLog(logId, {
        timeSpent: timeSpentMinutes,
        comment: editData.comment,
      });

      setEditingId(null);
      setEditData({ timeSpent: '', comment: '' });
      toast({ description: 'Time log updated' });
      onLogUpdated?.(logId);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.response?.data?.message || 'Failed to update log',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteLog = async (logId: string) => {
    if (!confirm('Delete this time log? This cannot be undone.')) return;

    try {
      setLoading(true);
      await issueApiService.deleteTimeLog(logId);
      toast({ description: 'Time log deleted' });
      onLogDeleted?.(logId);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.response?.data?.message || 'Failed to delete log',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">Loading time logs...</div>;
  }

  if (!logs || logs.length === 0) {
    return <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">No time logs yet</div>;
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar">
      {logs.map((log) => {
        const isEditing = editingId === log._id;
        const isOwner = currentUserId && log.userId._id === currentUserId;
        const userName = `${log.userId.firstName} ${log.userId.lastName}`;
        const logDate = new Date(log.logDate).toLocaleDateString();

        return (
          <div key={log._id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            {isEditing ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Time (hours)</label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={editData.timeSpent}
                      onChange={(e) => setEditData({ ...editData, timeSpent: e.target.value })}
                      className="h-8 text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Date</label>
                    <Input
                      type="date"
                      value={new Date(log.logDate).toISOString().split('T')[0]}
                      disabled
                      className="h-8 text-xs bg-gray-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 dark:text-gray-400"
                    />
                  </div>
                </div>
                <Textarea
                  placeholder="Add comment..."
                  value={editData.comment}
                  onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
                  className="text-xs min-h-[60px] dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => saveEdit(log._id)}
                    disabled={loading}
                    className="h-8 text-xs"
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit} disabled={loading} className="h-8 text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{formatDuration(log.timeSpent)}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-600">•</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{logDate}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    Logged by <span className="font-medium text-gray-900 dark:text-white">{userName}</span>
                  </div>
                  {log.comment && (
                    <div className="text-xs text-gray-700 dark:text-gray-200 italic bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 p-2 rounded mt-1">
                      &quot;{log.comment}&quot;
                    </div>
                  )}
                </div>

                {isOwner && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(log)}
                      disabled={loading}
                      className="h-7 w-7 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-700"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLog(log._id)}
                      disabled={loading}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-slate-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
