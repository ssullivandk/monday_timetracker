import { useEffect, useRef } from 'react';
import axios from 'axios';

interface UseDraftAutoSaveProps {
  comment: string;
  userId: string;
}

export function useDraftAutoSave({ comment, userId }: UseDraftAutoSaveProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set a new debounce timer for 500ms
    debounceRef.current = setTimeout(async () => {
      try {
        // Call the API to save/update the draft
        await axios.post('/api/time-entries/add', { comment, userId });
      } catch (error) {
        console.error('Error auto-saving draft:', error);
      }
    }, 500);

    // Cleanup: Clear timer on unmount or dependency change
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [comment, userId]); // Re-run on comment or userId change
}