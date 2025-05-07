
import React from 'react';
import { X } from 'lucide-react';

interface MediaPreviewProps {
  media: File;
  onRemove: () => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ media, onRemove }) => {
  if (!media) return null;
  
  return (
    <div className="mb-2 relative inline-block">
      <img
        src={URL.createObjectURL(media)}
        alt="Selected media"
        className="h-12 w-auto rounded-lg"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
        aria-label="Remove media"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

export default MediaPreview;
