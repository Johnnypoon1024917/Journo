import React, { useState, useEffect } from 'react';
import { ExpenseEntry, ExpenseFormData, TripMember, CustomSplit, SplitType } from '../../../types/expense';
import { BudgetCategory } from '../../../types/trip';
import { AmountInput } from './AmountInput';
import { CategorySelect } from './CategorySelect';
import { DatePicker } from './DatePicker';
import { NoteInput } from './NoteInput';
import { SplitSelector } from './SplitSelector';

interface ExpenseFormProps {
  tripId: string;
  initialData?: ExpenseEntry;
  tripMembers: TripMember[];
  currency: string;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

interface FormErrors {
  amount?: string;
  category?: string;
  date?: string;
  split?: string;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  tripId,
  initialData,
  tripMembers,
  currency,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [amount, setAmount] = useState(initialData?.amount || 0);
  const [category, setCategory] = useState<BudgetCategory | ''>(initialData?.category || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString());
  const [note, setNote] = useState(initialData?.note || '');
  const [paidBy, setPaidBy] = useState(initialData?.paidBy || '');
  const [splitWith, setSplitWith] = useState<string[]>(initialData?.splitWith || []);
  const [splitType, setSplitType] = useState<SplitType>(initialData?.splitType || 'equal');
  const [customSplits, setCustomSplits] = useState<CustomSplit[]>(initialData?.customSplits || []);
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    if (!date) {
      newErrors.date = 'Please select a date';
    }

    // Validate custom splits if applicable
    if (splitWith.length > 0 && splitType === 'custom') {
      const total = customSplits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(total - amount) > 0.01) {
        newErrors.split = 'Custom split amounts must equal the total amount';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData: ExpenseFormData = {
        amount,
        category: category as BudgetCategory,
        date,
        note: note || undefined,
        paidBy: paidBy || undefined,
        splitWith: splitWith.length > 0 ? splitWith : undefined,
        splitType: splitWith.length > 0 ? splitType : undefined,
        customSplits: splitWith.length > 0 && splitType === 'custom' ? customSplits : undefined,
      };

      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting expense:', error);
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Discard changes?')) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Amount */}
      <AmountInput
        value={amount}
        currency={currency}
        onChange={setAmount}
        error={errors.amount}
        label="Amount"
        placeholder="0.00"
        required
      />

      {/* Category */}
      <CategorySelect
        value={category}
        onChange={setCategory}
        error={errors.category}
        label="Category"
        required
      />

      {/* Date */}
      <DatePicker
        value={date}
        onChange={setDate}
        error={errors.date}
        label="Date"
        required
      />

      {/* Note */}
      <NoteInput
        value={note}
        onChange={setNote}
        label="Note"
        placeholder="Add a note (optional)"
        maxLength={200}
      />

      {/* Split Selector */}
      {tripMembers.length > 1 && (
        <SplitSelector
          tripMembers={tripMembers}
          paidBy={paidBy}
          splitWith={splitWith}
          splitType={splitType}
          customSplits={customSplits}
          totalAmount={amount}
          onPaidByChange={setPaidBy}
          onSplitWithChange={setSplitWith}
          onSplitTypeChange={setSplitType}
          onCustomSplitsChange={setCustomSplits}
          error={errors.split}
        />
      )}

      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-pink-500 text-white font-semibold hover:from-pink-500 hover:to-pink-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {initialData ? 'Update Expense' : 'Add Expense'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};
