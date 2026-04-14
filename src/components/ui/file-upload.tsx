import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import { attachmentApiService } from '@/api/attachment/services';
import { useToast } from '@/hooks/use-toast';

type Props = {
  type: 'bug' | 'task' | 'issue';
  id: string; // bugId, taskId, or issueId
  onUploaded?: (url: string) => void;
};

export default function FileUpload({ type, id, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 2MB',
        variant: 'destructive',
      });
      if (e.target) e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      let res: any;
      res = await attachmentApiService.uploadWorkItemAttachment({ workItemId: id, file });
      const url = res?.url || res?.data?.url || '';
      if (!url) {
        toast({
          title: 'Error',
          description: 'Upload failed: no file URL returned',
          variant: 'destructive',
        });
      } else if (onUploaded) onUploaded(url);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to upload file';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // clear input value
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <input
        ref={inputRef}
        id={`file-upload-${type}-${id}`}
        type="file"
        onChange={handleChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      <Button
        variant="outline"
        className="h-8"
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader className="animate-spin" /> : 'Upload'}
      </Button>
    </div>
  );
}





