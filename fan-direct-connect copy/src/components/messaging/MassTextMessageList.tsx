
import React from 'react';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  media?: string;
  status?: string;
}

interface MassTextMessageListProps {
  messages: Message[];
}

const MassTextMessageList: React.FC<MassTextMessageListProps> = ({ messages }) => {
  return (
    <div className="flex-1 p-3 overflow-y-auto">
      {messages.map((msg) => (
        <div key={msg.id} className="flex justify-end mb-2">
          <div className="max-w-[80%] rounded-xl px-3 py-2 bg-gradient-brand text-white rounded-br-none">
            <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
            {msg.media && (
              <div className="mt-2">
                <img
                  src={msg.media}
                  alt="Attached media"
                  className="rounded-lg max-h-32 w-auto"
                  loading="lazy"
                />
              </div>
            )}
            <p className="text-xs mt-1 text-gray-200">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {msg.status && (
                <span className="ml-1 text-xs">
                  • {msg.status === 'error' ? 'Failed' : msg.status}
                </span>
              )}
            </p>
          </div>
        </div>
      ))}
      {messages.length === 0 && (
        <div className="h-full flex items-center justify-center text-gray-400">
          <p>Send a mass text to all your subscribers</p>
        </div>
      )}
    </div>
  );
};

export default MassTextMessageList;
