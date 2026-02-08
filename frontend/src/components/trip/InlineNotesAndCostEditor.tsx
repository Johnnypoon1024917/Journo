import React, { useState, useEffect, useRef, useCallback } from 'react';

interface InlineNotesAndCostEditorProps {
  notes: string | null;
  cost: number | null;
  costCurrency: string | null;
  onSave: (notes: string | null, cost: number | null, costCurrency: string) => void;
  onClose: () => void;
  className?: string;
}

export const InlineNotesAndCostEditor: React.FC<InlineNotesAndCostEditorProps> = ({
  notes,
  cost,
  costCurrency,
  onSave,
  onClose,
  className = '',
}) => {
  const [localNotes, setLocalNotes] = useState(notes || '');
  const [localCost, setLocalCost] = useState(cost?.toString() || '');
  const [localCurrency, setLocalCurrency] = useState(costCurrency || 'HKD');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localNotes]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, []);

  // Optimistic save with debounce
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const parsedCost = localCost.trim() === '' ? null : parseFloat(localCost);
        const finalNotes = localNotes.trim() === '' ? null : localNotes.trim();
        
        await onSave(finalNotes, parsedCost, localCurrency);
      } catch (error) {
        console.error('Failed to save:', error);
      } finally {
        setIsSaving(false);
      }
    }, 800); // 800ms debounce
  }, [localNotes, localCost, localCurrency, onSave]);

  // Trigger save on changes
  useEffect(() => {
    debouncedSave();
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [localNotes, localCost, localCurrency, debouncedSave]);

  // Handle notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalNotes(e.target.value);
  };

  // Handle cost change
  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setLocalCost(value);
    }
  };

  // Handle currency change
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalCurrency(e.target.value);
  };

  // Format cost for display
  const formatCostDisplay = (): string => {
    if (localCost.trim() === '') return '';
    const parsedCost = parseFloat(localCost);
    if (isNaN(parsedCost)) return localCost;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: localCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(parsedCost);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
    // Cmd/Ctrl + Enter to save and close
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      onClose();
    }
  };

  return (
    <div className={`inline-notes-cost-editor ${className}`} onKeyDown={handleKeyDown}>
      <div className="editor-header">
        <h4 className="editor-title">Edit Details</h4>
        <button
          className="editor-close"
          onClick={onClose}
          aria-label="Close editor"
          type="button"
        >
          ✕
        </button>
      </div>

      <div className="editor-body">
        {/* Cost Section */}
        <div className="editor-section">
          <label className="editor-label" htmlFor="cost-input">
            <span className="label-icon">💰</span>
            <span className="label-text">Cost</span>
          </label>
          <div className="cost-input-group">
            <select
              className="currency-select"
              value={localCurrency}
              onChange={handleCurrencyChange}
              aria-label="Currency"
            >
              <option value="HKD">HKD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CNY">CNY</option>
              <option value="TWD">TWD</option>
              <option value="SGD">SGD</option>
              <option value="AUD">AUD</option>
              <option value="CAD">CAD</option>
            </select>
            <input
              id="cost-input"
              type="text"
              inputMode="decimal"
              className="cost-input"
              value={localCost}
              onChange={handleCostChange}
              placeholder="0.00"
              aria-label="Cost amount"
            />
          </div>
          {localCost.trim() !== '' && !isNaN(parseFloat(localCost)) && (
            <div className="cost-preview">
              {formatCostDisplay()}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="editor-section">
          <label className="editor-label" htmlFor="notes-input">
            <span className="label-icon">📝</span>
            <span className="label-text">Notes</span>
          </label>
          <textarea
            id="notes-input"
            ref={textareaRef}
            className="notes-textarea"
            value={localNotes}
            onChange={handleNotesChange}
            placeholder="Add notes, tips, or reminders..."
            rows={3}
            aria-label="Notes"
          />
          <div className="notes-hint">
            <span className="hint-icon">💡</span>
            <span className="hint-text">
              Press Esc to close • Cmd/Ctrl+Enter to save and close
            </span>
          </div>
        </div>
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="saving-indicator">
          <div className="saving-spinner" />
          <span className="saving-text">Saving...</span>
        </div>
      )}

      <style>{`
        .inline-notes-cost-editor {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          width: 100%;
          max-width: 500px;
          animation: slideIn 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dark .inline-notes-cost-editor {
          background: #1f2937;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .dark .editor-header {
          background: #111827;
          border-bottom-color: #374151;
        }

        .editor-title {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .dark .editor-title {
          color: #f9fafb;
        }

        .editor-close {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e5e7eb;
          border: none;
          border-radius: 6px;
          color: #6b7280;
          font-size: 16px;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dark .editor-close {
          background: #374151;
          color: #9ca3af;
        }

        .editor-close:hover {
          background: #d1d5db;
          color: #1f2937;
          transform: scale(1.1);
        }

        .dark .editor-close:hover {
          background: #4b5563;
          color: #f9fafb;
        }

        .editor-close:active {
          transform: scale(0.95);
        }

        .editor-close:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        .editor-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .editor-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .editor-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .dark .editor-label {
          color: #d1d5db;
        }

        .label-icon {
          font-size: 14px;
        }

        .label-text {
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cost-input-group {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }

        .currency-select {
          flex-shrink: 0;
          padding: 10px 12px;
          background: #f3f4f6;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          cursor: pointer;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          padding-right: 32px;
        }

        .dark .currency-select {
          background: #374151;
          border-color: #4b5563;
          color: #f9fafb;
        }

        .currency-select:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .dark .currency-select:hover {
          border-color: #60a5fa;
          background-color: #1e3a8a;
        }

        .currency-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .cost-input {
          flex: 1;
          padding: 10px 14px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          font-variant-numeric: tabular-nums;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dark .cost-input {
          background: #111827;
          border-color: #4b5563;
          color: #f9fafb;
        }

        .cost-input::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }

        .cost-input:hover {
          border-color: #3b82f6;
        }

        .dark .cost-input:hover {
          border-color: #60a5fa;
        }

        .cost-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .cost-preview {
          padding: 8px 12px;
          background: #dbeafe;
          border: 1px solid #3b82f6;
          border-radius: 6px;
          font-size: 18px;
          font-weight: 700;
          color: #1e40af;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }

        .dark .cost-preview {
          background: #1e3a8a;
          border-color: #60a5fa;
          color: #bfdbfe;
        }

        .notes-textarea {
          width: 100%;
          min-height: 80px;
          max-height: 300px;
          padding: 12px 14px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.6;
          color: #1f2937;
          resize: none;
          overflow-y: auto;
          transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }

        .dark .notes-textarea {
          background: #111827;
          border-color: #4b5563;
          color: #f9fafb;
        }

        .notes-textarea::placeholder {
          color: #9ca3af;
        }

        .notes-textarea:hover {
          border-color: #3b82f6;
        }

        .dark .notes-textarea:hover {
          border-color: #60a5fa;
        }

        .notes-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .notes-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #f0f9ff;
          border-radius: 6px;
        }

        .dark .notes-hint {
          background: #0c4a6e;
        }

        .hint-icon {
          font-size: 12px;
          flex-shrink: 0;
        }

        .hint-text {
          font-size: 11px;
          line-height: 1.4;
          color: #0369a1;
        }

        .dark .hint-text {
          color: #bae6fd;
        }

        .saving-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: #f0f9ff;
          border-top: 1px solid #bfdbfe;
        }

        .dark .saving-indicator {
          background: #0c4a6e;
          border-top-color: #075985;
        }

        .saving-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #bfdbfe;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .saving-text {
          font-size: 12px;
          font-weight: 500;
          color: #0369a1;
        }

        .dark .saving-text {
          color: #bae6fd;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .inline-notes-cost-editor {
            max-width: 100%;
            border-radius: 12px 12px 0 0;
          }

          .editor-header {
            padding: 12px 16px;
          }

          .editor-title {
            font-size: 15px;
          }

          .editor-body {
            padding: 16px;
            gap: 16px;
          }

          .cost-input {
            font-size: 15px;
          }

          .notes-textarea {
            font-size: 13px;
            min-height: 100px;
          }

          .hint-text {
            font-size: 10px;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .inline-notes-cost-editor,
          .saving-spinner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};
