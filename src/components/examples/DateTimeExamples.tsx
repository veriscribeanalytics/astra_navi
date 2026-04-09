/**
 * Example component showing how to use the datetime utilities
 * This file is for reference only - you can delete it if not needed
 */

'use client';

import React from 'react';
import { 
  formatDisplayDate, 
  formatDisplayTime, 
  formatDisplayDateTime,
  formatRelativeTime,
  formatChatTimestamp 
} from '@/lib/datetime';
import { useRealTime, useRelativeTime } from '@/hooks/useRealTime';

export default function DateTimeExamples() {
  // Example 1: Static date formatting
  const exampleDate = new Date('2026-04-08T14:30:00');
  
  // Example 2: Auto-updating current time
  const currentTime = useRealTime(); // Updates every minute
  
  // Example 3: Auto-updating relative time
  const messageDate = new Date(Date.now() - 1000 * 60 * 5); // 5 minutes ago
  const relativeTime = useRelativeTime(messageDate);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">DateTime Utility Examples</h2>
      
      {/* Static Formatting */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Static Date Formatting</h3>
        <div className="space-y-1 text-sm">
          <p>Date only: {formatDisplayDate(exampleDate)}</p>
          <p>Time only: {formatDisplayTime(exampleDate)}</p>
          <p>Date & Time: {formatDisplayDateTime(exampleDate)}</p>
          <p>Relative: {formatRelativeTime(exampleDate)}</p>
          <p>Chat timestamp: {formatChatTimestamp(exampleDate)}</p>
        </div>
      </section>

      {/* Auto-Updating Current Time */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Auto-Updating Current Time</h3>
        <div className="space-y-1 text-sm">
          <p>Current time (updates every minute): {formatDisplayTime(currentTime)}</p>
          <p>Current date & time: {formatDisplayDateTime(currentTime)}</p>
        </div>
      </section>

      {/* Auto-Updating Relative Time */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Auto-Updating Relative Time</h3>
        <div className="space-y-1 text-sm">
          <p>Message sent: {relativeTime}</p>
          <p className="text-xs text-gray-500">
            (This will automatically update as time passes)
          </p>
        </div>
      </section>

      {/* Usage in Components */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Usage Examples</h3>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
{`// In your component:
import { formatDisplayDate } from '@/lib/datetime';
import { useRelativeTime } from '@/hooks/useRealTime';

function MyComponent({ message }) {
  // Static display
  const createdDate = formatDisplayDate(message.createdAt);
  
  // Auto-updating display
  const timeAgo = useRelativeTime(message.createdAt);
  
  return (
    <div>
      <p>Created: {createdDate}</p>
      <p>Posted: {timeAgo}</p>
    </div>
  );
}`}
        </pre>
      </section>
    </div>
  );
}
