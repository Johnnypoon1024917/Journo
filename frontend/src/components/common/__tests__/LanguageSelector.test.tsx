import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import LanguageSelector from '../LanguageSelector';
import i18n from '../../../i18n/config';

describe('LanguageSelector Component', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  const renderComponent = () => {
    return render(
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />
      </I18nextProvider>
    );
  };

  it('should render language selector', () => {
    renderComponent();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should display current language', () => {
    renderComponent();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });

  it('should have three language options', () => {
    renderComponent();
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
  });

  it('should have English option', () => {
    renderComponent();
    expect(screen.getByRole('option', { name: /English/i })).toBeInTheDocument();
  });

  it('should have Traditional Chinese option', () => {
    renderComponent();
    expect(screen.getByRole('option', { name: /繁體中文/i })).toBeInTheDocument();
  });

  it('should have Simplified Chinese option', () => {
    renderComponent();
    expect(screen.getByRole('option', { name: /简体中文/i })).toBeInTheDocument();
  });

  it('should change language when option is selected', async () => {
    renderComponent();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    
    fireEvent.change(select, { target: { value: 'zh-TW' } });
    
    await waitFor(() => {
      expect(i18n.language).toBe('zh-TW');
    });
  });

  it('should persist language change to localStorage', async () => {
    renderComponent();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    
    fireEvent.change(select, { target: { value: 'zh-CN' } });
    
    await waitFor(() => {
      expect(localStorage.getItem('i18nextLng')).toBe('zh-CN');
    });
  });

  it('should update select value when language changes', async () => {
    renderComponent();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    
    await i18n.changeLanguage('zh-TW');
    
    await waitFor(() => {
      expect(select.value).toBe('zh-TW');
    });
  });

  it('should switch from English to Traditional Chinese', async () => {
    renderComponent();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    
    expect(select.value).toBe('en');
    
    fireEvent.change(select, { target: { value: 'zh-TW' } });
    
    await waitFor(() => {
      expect(select.value).toBe('zh-TW');
      expect(i18n.language).toBe('zh-TW');
    });
  });

  it('should switch from English to Simplified Chinese', async () => {
    renderComponent();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    
    expect(select.value).toBe('en');
    
    fireEvent.change(select, { target: { value: 'zh-CN' } });
    
    await waitFor(() => {
      expect(select.value).toBe('zh-CN');
      expect(i18n.language).toBe('zh-CN');
    });
  });

  it('should switch between Chinese variants', async () => {
    renderComponent();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    
    // First switch to Traditional Chinese
    fireEvent.change(select, { target: { value: 'zh-TW' } });
    
    await waitFor(() => {
      expect(select.value).toBe('zh-TW');
    });
    
    // Then switch to Simplified Chinese
    fireEvent.change(select, { target: { value: 'zh-CN' } });
    
    await waitFor(() => {
      expect(select.value).toBe('zh-CN');
      expect(i18n.language).toBe('zh-CN');
    });
  });

  it('should maintain language selection across re-renders', async () => {
    const { rerender } = renderComponent();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    
    fireEvent.change(select, { target: { value: 'zh-TW' } });
    
    await waitFor(() => {
      expect(select.value).toBe('zh-TW');
    });
    
    rerender(
      <I18nextProvider i18n={i18n}>
        <LanguageSelector />
      </I18nextProvider>
    );
    
    const selectAfterRerender = screen.getByRole('combobox') as HTMLSelectElement;
    expect(selectAfterRerender.value).toBe('zh-TW');
  });
});
