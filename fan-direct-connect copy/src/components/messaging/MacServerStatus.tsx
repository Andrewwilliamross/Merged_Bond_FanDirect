
import React from 'react';
import { CheckCircle } from 'lucide-react';

export function MacServerStatus() {
  return (
    <div className="rounded-md bg-green-50 p-2 mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-green-800">
            Your messages will be delivered via iMessage
          </p>
        </div>
      </div>
    </div>
  );
}
