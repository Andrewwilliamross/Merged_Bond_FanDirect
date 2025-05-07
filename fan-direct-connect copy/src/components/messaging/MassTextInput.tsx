
import React, { useRef } from 'react';
import { Send, Paperclip, LoaderCircle } from 'lucide-react';
import MediaPreview from './MediaPreview';

interface MassTextInputProps {
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  selectedMedia: File | null;
  setSelectedMedia: (media: File | null) => void;
  isSending: boolean;
  onSendMessage: () => Promise<void>;
}

const MassTextInput: React.FC<MassTextInputProps> = ({
  currentMessage,
  setCurrentMessage,
  selectedMedia,
  setSelectedMedia,
  isSending,
  onSendMessage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedMedia(e.target.files[0]);
    }
  };

  return (
    <div className="p-3 border-t bg-white">
      {selectedMedia && (
        <MediaPreview media={selectedMedia} onRemove={() => setSelectedMedia(null)} />
      )}

      <div className="flex items-center">
        <div className="flex-shrink-0 mr-2">
          <label className="cursor-pointer text-gray-500 hover:text-gray-700 p-2 md:p-0">
            <Paperclip className="h-5 w-5" />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
            />
          </label>
        </div>
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your mass text message..."
          className="flex-1 py-2 px-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-offset-2 focus:outline-none focus:border-brand-blue focus:ring-brand-blue text-sm"
          disabled={isSending}
        />
        <button
          type="button"
          onClick={onSendMessage}
          disabled={(!currentMessage.trim() && !selectedMedia) || isSending}
          className="bg-gradient-brand text-white p-2 rounded-r-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send mass text"
        >
          {isSending ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MassTextInput;
