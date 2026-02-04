import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { issueApiService } from '@/api/issue/services/issueApiService';
import { useToast } from '@/hooks/use-toast';

interface LogWorkDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  onSuccess?: () => void;
}

export function LogWorkDialog({ isOpen, onOpenChange, itemId, onSuccess }: LogWorkDialogProps) {
  const [hours, setHours] = useState<number | ''>('');
  const [adjustRemaining, setAdjustRemaining] = useState(true);
  const [comment, setComment] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!hours || Number(hours) <= 0) {
      toast({ title: 'Error', description: 'Please enter time spent (hours)', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const minutes = Math.round(Number(hours) * 60);
      await issueApiService.logWork(itemId, { timeSpent: minutes, comment, adjustRemaining });
      toast({ title: 'Success', description: 'Time logged' });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Work</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Time Spent (hours)</label>
            <Input type="number" step={0.25} min={0} value={hours as any} onChange={(e) => setHours(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>

          <div>
            <label className="text-sm font-medium">Adjust remaining estimate automatically</label>
            <div className="mt-1">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={adjustRemaining} onChange={(e) => setAdjustRemaining(e.target.checked)} />
                <span className="text-sm">Yes</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Comment (optional)</label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Logging...' : 'Log Work'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LogWorkDialog;
