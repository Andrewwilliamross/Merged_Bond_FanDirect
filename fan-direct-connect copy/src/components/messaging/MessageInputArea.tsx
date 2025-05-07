
import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Paperclip, Send, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { sendOutboundMessage } from '@/utils/outboundMessages';
import { supabase } from '@/integrations/supabase/client';
import { MacServerStatus } from './MacServerStatus';

interface MessageInputAreaProps {
  contactPhone: string;
  onMessageSent: () => void;
}

const MessageInputArea = ({ contactPhone, onMessageSent }: MessageInputAreaProps) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) return;
    
    if (!user) {
      toast.error('You must be logged in to send messages');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let fileUrl = null;
      
      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, selectedFile);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);
          
        fileUrl = data.publicUrl;
      }
      
      // Send the message
      await sendOutboundMessage({
        fanPhoneNumber: contactPhone,
        messageText: message,
        attachmentUrl: fileUrl || undefined,
      });
      
      // Clear the input after sending
      setMessage('');
      setSelectedFile(null);
      
      // Trigger refresh in parent component
      onMessageSent();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t p-4 bg-white">
      {/* Show Mac server status */}
      <MacServerStatus />
      
      {selectedFile && (
        <div className="mb-2 flex items-center p-2 bg-gray-100 rounded-md">
          <div className="flex-1 text-sm truncate">{selectedFile.name}</div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRemoveFile}
            className="h-7 w-7 rounded-full"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={handleFileSelect}
          disabled={isLoading}
        >
          <Paperclip className="h-4 w-4" />
          <span className="sr-only">Attach file</span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </Button>
        
        <div className="flex-1 relative">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="pr-10"
          />
        </div>
        
        <Button
          onClick={handleSendMessage}
          disabled={(!message.trim() && !selectedFile) || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
};

export default MessageInputArea;
