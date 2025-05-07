
import React from 'react';
import { useMassText } from '@/hooks/use-mass-text';
import MassTextMessageList from './MassTextMessageList';
import MassTextInput from './MassTextInput';
import { Card } from '@/components/ui/card';
import { LoaderCircle } from 'lucide-react';

const MassTextThread = () => {
  const {
    messages,
    currentMessage,
    setCurrentMessage,
    selectedMedia,
    setSelectedMedia,
    isSending,
    isLoading,
    handleSendMessage
  } = useMassText();

  return (
    <Card className="flex flex-col h-[300px] overflow-hidden bg-gray-50 shadow-sm">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      ) : (
        <>
          <MassTextMessageList messages={messages} />
          <MassTextInput
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            selectedMedia={selectedMedia}
            setSelectedMedia={setSelectedMedia}
            isSending={isSending}
            onSendMessage={handleSendMessage}
          />
        </>
      )}
    </Card>
  );
};

export default MassTextThread;
