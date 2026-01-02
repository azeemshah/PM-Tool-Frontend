import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import { uploadBugAttachment, uploadTaskAttachment } from '@/lib/api';

type Props = {
  type: 'bug' | 'task';
  id: string; // bugId or taskId
  onUploaded?: (url: string) => void;
};

export default function FileUpload({ type, id, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      let res: any;
      if (type === 'bug') {
        res = await uploadBugAttachment({ bugId: id, file });
      } else {
        res = await uploadTaskAttachment({ taskId: id, file });
      }
      const url = res?.url || res?.data?.url || '';
      if (onUploaded) onUploaded(url);
    } catch (err) {
      // swallow - caller should handle toasts
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      // clear input value
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <input id={`file-upload-${type}-${id}`} type="file" onChange={handleChange} className="hidden" />
      <label htmlFor={`file-upload-${type}-${id}`}> 
        <Button variant="outline" className="h-8">
          {uploading ? <Loader className="animate-spin" /> : 'Upload'}
        </Button>
      </label>
    </div>
  );
}
