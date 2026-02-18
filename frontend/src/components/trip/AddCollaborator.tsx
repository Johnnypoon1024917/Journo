import { useState } from 'react';
import { CollaboratorRole } from '../../types/collaboration';
import { collaboratorService } from '../../features/collab/collaboratorService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useToast } from '../../hooks/useToast';

interface AddCollaboratorProps {
  tripId: string;
  onAdded: () => void;
}

export function AddCollaborator({ tripId, onAdded }: AddCollaboratorProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollaboratorRole>('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { error, success } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await collaboratorService.addCollaboratorByEmail(tripId, email, role);
      success('Collaborator added successfully');
      setEmail('');
      setRole('viewer');
      setShowForm(false);
      onAdded();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add collaborator';
      error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        <span className="mr-2">➕</span>
        Add Collaborator
      </Button>
    );
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Invite Collaborator
      </h4>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The user must have a Journo account with this email
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as CollaboratorRole)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="viewer">Viewer - Can view only</option>
            <option value="editor">Editor - Can edit trip</option>
          </select>
          <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <p>
              <strong>Editor:</strong> Can edit trip details, add places, upload photos, and manage packing list
            </p>
            <p>
              <strong>Viewer:</strong> Can only view the trip (read-only access)
            </p>
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Adding...' : 'Add Collaborator'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setShowForm(false);
              setEmail('');
              setRole('viewer');
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
