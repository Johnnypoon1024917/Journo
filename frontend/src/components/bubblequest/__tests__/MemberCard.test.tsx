/**
 * Tests for MemberCard Component
 * 
 * Tests the MemberCard component for displaying trip members.
 * 
 * Requirements: 14.1, 14.3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemberCard } from '../MemberCard';
import { TripCollaboratorWithUser } from '@/types/collaboration';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'members.roles.owner': 'Owner',
        'members.roles.editor': 'Editor',
        'members.roles.viewer': 'Viewer',
        'members.status.online': 'Online',
        'members.status.offline': 'Offline',
        'members.actions.makeEditor': 'Make Editor',
        'members.actions.makeViewer': 'Make Viewer',
        'members.actions.remove': 'Remove Member',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('MemberCard', () => {
  const mockMember: TripCollaboratorWithUser = {
    id: 'collab-1',
    trip_id: 'trip-1',
    user_id: 'user-1',
    role: 'editor',
    invited_by: 'user-owner',
    created_at: '2024-01-01T00:00:00Z',
    user: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
  };

  describe('Requirement 14.1: Display avatar, name, and email', () => {
    it('renders member name', () => {
      render(<MemberCard member={mockMember} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders member email', () => {
      render(<MemberCard member={mockMember} />);
      
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('renders avatar with initials', () => {
      const { container } = render(<MemberCard member={mockMember} />);
      
      // Check for initials "JD" from "John Doe"
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('generates correct initials for single name', () => {
      const singleNameMember = {
        ...mockMember,
        user: { ...mockMember.user, name: 'Madonna' },
      };
      
      render(<MemberCard member={singleNameMember} />);
      
      // Should show first two letters
      expect(screen.getByText('MA')).toBeInTheDocument();
    });

    it('generates correct initials for multi-part name', () => {
      const multiNameMember = {
        ...mockMember,
        user: { ...mockMember.user, name: 'Mary Jane Watson' },
      };
      
      render(<MemberCard member={multiNameMember} />);
      
      // Should show first and last initials
      expect(screen.getByText('MW')).toBeInTheDocument();
    });
  });

  describe('Requirement 14.3: Display role', () => {
    it('displays owner role badge', () => {
      const ownerMember = { ...mockMember, role: 'owner' as const };
      render(<MemberCard member={ownerMember} />);
      
      expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    it('displays editor role badge', () => {
      render(<MemberCard member={mockMember} />);
      
      expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    it('displays viewer role badge', () => {
      const viewerMember = { ...mockMember, role: 'viewer' as const };
      render(<MemberCard member={viewerMember} />);
      
      expect(screen.getByText('Viewer')).toBeInTheDocument();
    });
  });

  describe('Online/Offline Status', () => {
    it('shows online status indicator', () => {
      render(<MemberCard member={mockMember} isOnline={true} />);
      
      const statusIndicator = screen.getByLabelText('Online');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('shows offline status indicator', () => {
      render(<MemberCard member={mockMember} isOnline={false} />);
      
      const statusIndicator = screen.getByLabelText('Offline');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('defaults to offline when isOnline not provided', () => {
      render(<MemberCard member={mockMember} />);
      
      const statusIndicator = screen.getByLabelText('Offline');
      expect(statusIndicator).toBeInTheDocument();
    });
  });

  describe('Edit/Remove Actions (for owner only)', () => {
    it('does not show menu for regular members when canManage is false', () => {
      render(<MemberCard member={mockMember} canManage={false} />);
      
      expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument();
    });

    it('does not show menu for owner even when canManage is true', () => {
      render(<MemberCard member={mockMember} isOwner={true} canManage={true} />);
      
      expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument();
    });

    it('shows menu button when canManage is true and not owner', () => {
      render(<MemberCard member={mockMember} canManage={true} />);
      
      expect(screen.getByLabelText('Menu')).toBeInTheDocument();
    });

    it('opens menu when menu button is clicked', () => {
      render(
        <MemberCard
          member={mockMember}
          canManage={true}
          onRoleChange={vi.fn()}
          onRemove={vi.fn()}
        />
      );
      
      const menuButton = screen.getByLabelText('Menu');
      fireEvent.click(menuButton);
      
      expect(screen.getByText('Make Viewer')).toBeInTheDocument();
      expect(screen.getByText('Remove Member')).toBeInTheDocument();
    });

    it('shows "Make Viewer" option for editor', () => {
      render(
        <MemberCard
          member={mockMember}
          canManage={true}
          onRoleChange={vi.fn()}
        />
      );
      
      const menuButton = screen.getByLabelText('Menu');
      fireEvent.click(menuButton);
      
      expect(screen.getByText('Make Viewer')).toBeInTheDocument();
    });

    it('shows "Make Editor" option for viewer', () => {
      const viewerMember = { ...mockMember, role: 'viewer' as const };
      render(
        <MemberCard
          member={viewerMember}
          canManage={true}
          onRoleChange={vi.fn()}
        />
      );
      
      const menuButton = screen.getByLabelText('Menu');
      fireEvent.click(menuButton);
      
      expect(screen.getByText('Make Editor')).toBeInTheDocument();
    });

    it('calls onRoleChange when role change is clicked', () => {
      const onRoleChange = vi.fn();
      render(
        <MemberCard
          member={mockMember}
          canManage={true}
          onRoleChange={onRoleChange}
        />
      );
      
      const menuButton = screen.getByLabelText('Menu');
      fireEvent.click(menuButton);
      
      const makeViewerButton = screen.getByText('Make Viewer');
      fireEvent.click(makeViewerButton);
      
      expect(onRoleChange).toHaveBeenCalledWith('collab-1', 'viewer');
    });

    it('calls onRemove when remove button is clicked', async () => {
      const onRemove = vi.fn();
      render(
        <MemberCard
          member={mockMember}
          canManage={true}
          onRemove={onRemove}
        />
      );
      
      const menuButton = screen.getByLabelText('Menu');
      fireEvent.click(menuButton);
      
      const removeButton = screen.getByText('Remove Member');
      fireEvent.click(removeButton);
      
      // onRemove is called after animation timeout (300ms)
      await new Promise(resolve => setTimeout(resolve, 350));
      expect(onRemove).toHaveBeenCalledWith('collab-1');
    });

    it('does not call onRoleChange for owner', () => {
      const onRoleChange = vi.fn();
      render(
        <MemberCard
          member={mockMember}
          isOwner={true}
          canManage={true}
          onRoleChange={onRoleChange}
        />
      );
      
      // Menu should not be visible for owner
      expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument();
    });

    it('does not call onRemove for owner', () => {
      const onRemove = vi.fn();
      render(
        <MemberCard
          member={mockMember}
          isOwner={true}
          canManage={true}
          onRemove={onRemove}
        />
      );
      
      // Menu should not be visible for owner
      expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label for status indicator', () => {
      render(<MemberCard member={mockMember} isOnline={true} />);
      
      expect(screen.getByLabelText('Online')).toBeInTheDocument();
    });

    it('has proper aria-label for menu button', () => {
      render(<MemberCard member={mockMember} canManage={true} />);
      
      expect(screen.getByLabelText('Menu')).toBeInTheDocument();
    });

    it('has focus styles on menu button', () => {
      render(<MemberCard member={mockMember} canManage={true} />);
      
      const menuButton = screen.getByLabelText('Menu');
      expect(menuButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Touch Optimization', () => {
    it('has minimum 44px touch target for menu button', () => {
      render(<MemberCard member={mockMember} canManage={true} />);
      
      const menuButton = screen.getByLabelText('Menu');
      expect(menuButton).toHaveClass('min-w-[44px]', 'min-h-[44px]');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to wrapper', () => {
      const { container } = render(
        <MemberCard member={mockMember} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
