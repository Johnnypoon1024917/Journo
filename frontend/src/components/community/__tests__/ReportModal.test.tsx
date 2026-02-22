/**
 * Unit tests for ReportModal component
 * 
 * Tests report submission and UI interactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportModal } from '../ReportModal';
import CommunityService from '@/services/communityService';

// Mock CommunityService
vi.mock('@/services/communityService', () => ({
  default: {
    reportPost: vi.fn(),
  },
}));

// Mock Modal component
vi.mock('../../common/Modal', () => ({
  Modal: ({ isOpen, children, title }: any) => 
    isOpen ? <div data-testid="modal"><h2>{title}</h2>{children}</div> : null,
}));

// Mock Button component
vi.mock('../../common/Button', () => ({
  Button: ({ children, onClick, disabled, type, isLoading }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled || isLoading} 
      type={type}
      data-loading={isLoading}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  ),
}));

describe('ReportModal', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    postId: 'post-123',
    postAuthor: 'John Doe',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when open', () => {
    render(<ReportModal {...defaultProps} />);
    
    expect(screen.getByText('Report Post')).toBeInTheDocument();
    expect(screen.getByText(/Reporting post by/)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should not render modal when closed', () => {
    render(<ReportModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Report Post')).not.toBeInTheDocument();
  });

  it('should display all report reason options', () => {
    render(<ReportModal {...defaultProps} />);
    
    expect(screen.getByText('Spam or misleading')).toBeInTheDocument();
    expect(screen.getByText('Harassment or bullying')).toBeInTheDocument();
    expect(screen.getByText('Hate speech or discrimination')).toBeInTheDocument();
    expect(screen.getByText('Violence or threats')).toBeInTheDocument();
    expect(screen.getByText('Inappropriate content')).toBeInTheDocument();
    expect(screen.getByText('False or misleading information')).toBeInTheDocument();
    expect(screen.getByText('Copyright violation')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('should allow selecting a reason', () => {
    render(<ReportModal {...defaultProps} />);
    
    const spamRadio = screen.getByLabelText('Spam or misleading');
    fireEvent.click(spamRadio);
    
    expect(spamRadio).toBeChecked();
  });

  it('should allow entering additional details', () => {
    render(<ReportModal {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/Provide any additional context/);
    fireEvent.change(textarea, { target: { value: 'This is spam content' } });
    
    expect(textarea).toHaveValue('This is spam content');
  });

  it('should show character count for description', () => {
    render(<ReportModal {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/Provide any additional context/);
    fireEvent.change(textarea, { target: { value: 'Test description' } });
    
    expect(screen.getByText(/16\/500/)).toBeInTheDocument();
  });

  it('should show error when submitting without reason', async () => {
    render(<ReportModal {...defaultProps} />);
    
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);
    
    // The button should be disabled when no reason is selected
    expect(submitButton).toBeDisabled();
  });

  it('should submit report with selected reason', async () => {
    vi.mocked(CommunityService.reportPost).mockResolvedValue(undefined);
    
    render(<ReportModal {...defaultProps} />);
    
    // Select reason
    const spamRadio = screen.getByLabelText('Spam or misleading');
    fireEvent.click(spamRadio);
    
    // Submit
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(CommunityService.reportPost).toHaveBeenCalledWith('post-123', {
        reason: 'spam',
        description: undefined,
      });
    });
  });

  it('should submit report with reason and description', async () => {
    vi.mocked(CommunityService.reportPost).mockResolvedValue(undefined);
    
    render(<ReportModal {...defaultProps} />);
    
    // Select reason
    const harassmentRadio = screen.getByLabelText('Harassment or bullying');
    fireEvent.click(harassmentRadio);
    
    // Enter description
    const textarea = screen.getByPlaceholderText(/Provide any additional context/);
    fireEvent.change(textarea, { target: { value: 'Targeted harassment' } });
    
    // Submit
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(CommunityService.reportPost).toHaveBeenCalledWith('post-123', {
        reason: 'harassment',
        description: 'Targeted harassment',
      });
    });
  });

  it('should show success message after submission', async () => {
    vi.mocked(CommunityService.reportPost).mockResolvedValue(undefined);
    
    render(<ReportModal {...defaultProps} />);
    
    // Select reason and submit
    const spamRadio = screen.getByLabelText('Spam or misleading');
    fireEvent.click(spamRadio);
    
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Report Submitted')).toBeInTheDocument();
      expect(screen.getByText(/Thank you for helping keep our community safe/)).toBeInTheDocument();
    });
  });

  it('should show error message on submission failure', async () => {
    vi.mocked(CommunityService.reportPost).mockRejectedValue(new Error('Network error'));
    
    render(<ReportModal {...defaultProps} />);
    
    // Select reason and submit
    const spamRadio = screen.getByLabelText('Spam or misleading');
    fireEvent.click(spamRadio);
    
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('should disable submit button while submitting', async () => {
    vi.mocked(CommunityService.reportPost).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<ReportModal {...defaultProps} />);
    
    // Select reason and submit
    const spamRadio = screen.getByLabelText('Spam or misleading');
    fireEvent.click(spamRadio);
    
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);
    
    // Button should be disabled
    expect(submitButton).toBeDisabled();
  });

  it('should call onClose when cancel button clicked', () => {
    render(<ReportModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle missing post author gracefully', () => {
    render(<ReportModal {...defaultProps} postAuthor={undefined} />);
    
    expect(screen.getByText('Reporting this post')).toBeInTheDocument();
  });
});
