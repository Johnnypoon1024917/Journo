import { useState } from 'react';

interface NoteInputProps {
  onNoteAdded: (note: string) => void;
  onCancel: () => void;
}

export const NoteInput = ({ onNoteAdded, onCancel }: NoteInputProps) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!note.trim()) {
      setError('Please enter a note');
      return;
    }

    onNoteAdded(note.trim());
    
    // Reset form
    setNote('');
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2 text-xl">📝</span>
          Add Note
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="note-text"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Your Note
        </label>
        <textarea
          id="note-text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write your thoughts, memories, or travel tips..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          rows={6}
          maxLength={1000}
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
          {note.length}/1000
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={!note.trim()}
          className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          Add Note
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
