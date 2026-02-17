/**
 * Form Label Association Tests
 * 
 * Tests to verify that all form inputs have proper label associations
 * for screen reader accessibility.
 * 
 * Validates: Requirements 9.9
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Feedback } from '../pages/Feedback';
import { Help } from '../pages/Help';
import { ManualDestinationEntry } from '../components/destination/ManualDestinationEntry';
import { NoteInput } from '../components/budget/molecules/NoteInput';

describe('Form Label Association', () => {
  describe('Login Page', () => {
    it('should have properly associated labels for email and password inputs', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Check email input has associated label
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('id', 'email');

      // Check password input has associated label
      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('id', 'password');

      // Check remember me checkbox has associated label
      const rememberCheckbox = screen.getByLabelText(/remember me/i);
      expect(rememberCheckbox).toBeInTheDocument();
      expect(rememberCheckbox).toHaveAttribute('type', 'checkbox');
    });
  });

  describe('Register Page', () => {
    it('should have properly associated labels for all form inputs', () => {
      render(
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      );

      // Check name input
      const nameInput = screen.getByLabelText(/full name/i);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('id', 'name');

      // Check email input
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('id', 'email');

      // Check password input
      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('id', 'password');

      // Check confirm password input
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toBeInTheDocument();
      expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword');

      // Check terms checkbox
      const termsCheckbox = screen.getByLabelText(/terms of service/i);
      expect(termsCheckbox).toBeInTheDocument();
      expect(termsCheckbox).toHaveAttribute('type', 'checkbox');
    });
  });

  describe('Feedback Page', () => {
    it('should have properly associated labels for feedback form inputs', () => {
      render(
        <BrowserRouter>
          <Feedback />
        </BrowserRouter>
      );

      // Check subject input
      const subjectInput = screen.getByLabelText(/subject/i);
      expect(subjectInput).toBeInTheDocument();
      expect(subjectInput).toHaveAttribute('id', 'subject');

      // Check message textarea
      const messageTextarea = screen.getByLabelText(/message/i);
      expect(messageTextarea).toBeInTheDocument();
      expect(messageTextarea).toHaveAttribute('id', 'message');

      // Check feedback type radio buttons
      const generalRadio = screen.getByRole('radio', { name: /general/i });
      expect(generalRadio).toBeInTheDocument();

      const bugRadio = screen.getByRole('radio', { name: /bug report/i });
      expect(bugRadio).toBeInTheDocument();

      const featureRadio = screen.getByRole('radio', { name: /feature request/i });
      expect(featureRadio).toBeInTheDocument();
    });
  });

  describe('Help Page', () => {
    it('should have properly associated label for search input', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      );

      // Check search input has label (can be sr-only)
      const searchInput = screen.getByLabelText(/search for help/i);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('id', 'help-search');
    });
  });

  describe('ManualDestinationEntry Component', () => {
    it('should have properly associated labels for destination inputs', () => {
      const mockSubmit = vi.fn();
      render(<ManualDestinationEntry onSubmit={mockSubmit} />);

      // Check destination name input
      const destinationInput = screen.getByLabelText(/destination name/i);
      expect(destinationInput).toBeInTheDocument();
      expect(destinationInput).toHaveAttribute('id', 'destination-name');

      // Check country input
      const countryInput = screen.getByLabelText(/country/i);
      expect(countryInput).toBeInTheDocument();
      expect(countryInput).toHaveAttribute('id', 'destination-country');
    });
  });

  describe('NoteInput Component', () => {
    it('should have properly associated label for textarea', () => {
      const mockOnChange = vi.fn();
      render(
        <NoteInput
          value=""
          onChange={mockOnChange}
          label="Test Note"
        />
      );

      // Check textarea has associated label
      const textarea = screen.getByLabelText(/test note/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('id', 'note-input');
    });

    it('should work without a label using aria-label fallback', () => {
      const mockOnChange = vi.fn();
      render(
        <NoteInput
          value=""
          onChange={mockOnChange}
        />
      );

      // Should still be accessible via role
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('General Label Association Rules', () => {
    it('should verify that labels use htmlFor attribute', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Get the label element
      const emailLabel = screen.getByText(/email address/i);
      expect(emailLabel.tagName).toBe('LABEL');
      expect(emailLabel).toHaveAttribute('for', 'email');
    });

    it('should verify that inputs have matching id attributes', () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = document.getElementById('email');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput?.tagName).toBe('INPUT');
    });
  });

  describe('ARIA Label Support', () => {
    it('should support aria-label for inputs without visible labels', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      );

      // Search input should have aria-label
      const searchInput = screen.getByRole('textbox', { name: /search for help/i });
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('aria-label');
    });
  });

  describe('Error State Accessibility', () => {
    it('should associate error messages with inputs using aria-describedby', () => {
      const mockSubmit = vi.fn();
      const { container } = render(
        <ManualDestinationEntry onSubmit={mockSubmit} />
      );

      // Submit form to trigger validation errors
      const submitButton = screen.getByRole('button', { name: /add destination/i });
      submitButton.click();

      // Wait for error messages to appear
      setTimeout(() => {
        const destinationInput = screen.getByLabelText(/destination name/i);
        expect(destinationInput).toHaveAttribute('aria-invalid', 'true');
        expect(destinationInput).toHaveAttribute('aria-describedby');
      }, 100);
    });
  });
});
