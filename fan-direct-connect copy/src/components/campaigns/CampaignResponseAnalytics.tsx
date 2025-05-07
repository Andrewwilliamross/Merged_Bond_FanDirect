import React, { useState } from 'react';
import { ChevronDown, Paperclip, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';

// Utility hook for toggling
function useToggle(initial = false) {
  const [value, set] = useState(initial);
  return [value, () => set(!value)] as const;
}

interface ResponseClusterProps {
  category: string;
  count: number;
  messages: string[];
}

const DraftChatBox: React.FC<{ onSend: (msg: string, file?: File) => void; onClose: () => void; }> = ({ onSend, onClose }) => {
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!input.trim() && !file) return;
    setSending(true);
    setTimeout(() => {
      onSend(input, file || undefined);
      setInput('');
      setFile(null);
      setSending(false);
      onClose();
      toast.success("Draft sent");
    }, 1500); // fake send delay
  };

  return (
    <div className="flex flex-col mt-2 mb-1 border rounded-md p-2 bg-gray-50 space-y-2 w-full mx-auto">
      {file && (
        <div className="flex items-center space-x-2">
          <img src={URL.createObjectURL(file)} alt="attachment" className="h-8 w-auto rounded" />
          <span className="text-xs text-gray-600">{file.name}</span>
          <button className="text-xs text-red-500 ml-2" onClick={() => setFile(null)}>Remove</button>
        </div>
      )}
      <div className="flex items-center">
        <label className="cursor-pointer text-gray-500 hover:text-brand-purple mr-2">
          <Paperclip className="h-5 w-5" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
          />
        </label>
        <input
          className="flex-1 border rounded-l-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
          placeholder="Draft your reply…"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={sending}
        />
        <button
          className="bg-gradient-brand text-white px-2 py-1 rounded-r-md ml-1 flex items-center hover:opacity-90 disabled:opacity-50"
          onClick={handleSend}
          disabled={!input.trim() && !file || sending}
        >
          <Send className={`h-4 w-4 ${sending ? 'animate-spin-slow' : ''}`} />
        </button>
        <button className="text-xs text-gray-400 ml-2 underline" onClick={onClose} disabled={sending}>Cancel</button>
      </div>
      <style>
        {`
        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 1.1s linear infinite;
        }
        `}
      </style>
    </div>
  );
};

export const ResponseCluster: React.FC<ResponseClusterProps> = ({ category, count, messages }) => {
  const [showAll, setShowAll] = useToggle(false);
  const [showDraft, setShowDraft] = useToggle(false);
  const isMobile = useIsMobile();

  // Icon/emoji for categories
  const catEmoji: Record<string, string> = {
    "Questions/Answers": "❓",
    "Love ❤️": "❤️",
    "Requests": "💡",
    "Feedback": "📝",
    "Testimonials": "🌟",
    "Suggestions": "✨",
    "Ideas": "🚀",
    "Other": "🔔",
  };
  return (
    <div className="flex flex-col items-stretch bg-white border rounded-xl p-3 mb-2 transition-all shadow-sm w-full" style={{ fontSize: "0.95rem", minWidth: 0 }}>
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-semibold text-brand-purple text-sm flex items-center">
          <span className="mr-1.5 text-base">{catEmoji[category] || "🔔"}</span>
          {category} <span className="text-xs text-gray-500 font-normal ml-1">({count})</span>
        </h4>
      </div>
      <div className="space-y-1 mb-1">
        {messages.slice(0, showAll ? messages.length : 2).map((message, idx) => (
          <div 
            key={idx}
            className="text-xs text-gray-800 border-l-2 border-brand-purple pl-2 py-0.5 break-words"
          >"{message}"</div>
        ))}
        {messages.length > 2 && (
          <button
            onClick={setShowAll}
            className="flex items-center text-xs text-brand-blue hover:text-brand-purple mt-0.5"
          >
            <span>{showAll ? "Show fewer" : `Show all responses (${messages.length})`}</span>
            <ChevronDown className={`ml-1 h-3 w-3 duration-200 transform ${showAll ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {!showDraft ? (
        <button
          className="flex items-center justify-center mt-1 text-white bg-gradient-brand rounded-md px-2 py-1 text-xs font-medium hover:opacity-90 transition-all"
          onClick={setShowDraft}
        >
          <Send className="h-3.5 w-3.5 mr-1 inline" />
          Draft Response
        </button>
      ) : (
        <DraftChatBox
          onSend={() => {}}
          onClose={setShowDraft}
        />
      )}
    </div>
  );
};

interface ResponseClusteringProps {
  responses: Array<{
    category: string;
    count: number;
    messages: string[];
  }>;
  compact?: boolean;
  hideHeader?: boolean;
}

// Categories to show (remove "Collaboration")
const ALLOWED_CATEGORIES = [
  "Questions/Answers",
  "Love ❤️",
  "Requests",
  "Feedback",
  "Testimonials",
  "Suggestions",
  "Ideas",
  "Other",
];

export const CampaignResponseClustering: React.FC<ResponseClusteringProps> = ({ responses, compact, hideHeader }) => {
  const isMobile = useIsMobile();
  // Remove Collaboration cluster and keep only allowed
  const filtered = (responses || []).filter(r => ALLOWED_CATEGORIES.includes(r.category));

  if (!filtered.length) {
    return (
      <div className="py-2 text-xs text-gray-500 italic">
        No response data available for this campaign.
      </div>
    );
  }

  return (
    <div className={`py-2`}>
      {!hideHeader && (
        <h3 className="text-base font-semibold text-gray-900 mb-2" style={{ fontSize: compact ? "1.06rem" : undefined }}>
          Response Clustering
        </h3>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:gap-3">
        {filtered.map((cluster, idx) => (
          <ResponseCluster
            key={cluster.category + idx}
            category={cluster.category}
            count={cluster.count}
            messages={cluster.messages}
          />
        ))}
      </div>
    </div>
  );
};

export default CampaignResponseClustering;
