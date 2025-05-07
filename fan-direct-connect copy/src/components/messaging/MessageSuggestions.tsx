
import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MessageSuggestionsProps {
  suggestions: string[];
  onAcceptSuggestion: (suggestion: string) => void;
  onRejectSuggestion: (index: number) => void;
}

const MessageSuggestions = ({ 
  suggestions, 
  onAcceptSuggestion, 
  onRejectSuggestion 
}: MessageSuggestionsProps) => {
  const [activeSuggestions, setActiveSuggestions] = useState(suggestions);

  const handleRejectSuggestion = (indexToRemove: number) => {
    const updatedSuggestions = activeSuggestions.filter((_, index) => index !== indexToRemove);
    setActiveSuggestions(updatedSuggestions);
    onRejectSuggestion(indexToRemove);
  };

  return (
    <div className="min-h-[200px] p-3 bg-gray-50">
      {activeSuggestions.length > 0 ? (
        <>
          <p className="text-xs text-gray-500 mb-2">AI-powered suggestions:</p>
          <div className="space-y-2">
            {activeSuggestions.map((suggestion, index) => (
              <Card key={index} className="relative bg-white">
                <CardContent className="p-3">
                  <p className="text-sm text-gray-700 pr-16">{suggestion}</p>
                  <div className="absolute right-2 top-2 flex gap-1">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRejectSuggestion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      className="h-6 w-6 bg-green-500 hover:bg-green-600"
                      onClick={() => onAcceptSuggestion(suggestion)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-gray-500">No suggestions available</p>
        </div>
      )}
    </div>
  );
};

export default MessageSuggestions;
