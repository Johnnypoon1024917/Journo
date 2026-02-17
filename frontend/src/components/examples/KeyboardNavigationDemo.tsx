/**
 * Keyboard Navigation Demo Component
 * 
 * Demonstrates comprehensive keyboard navigation patterns:
 * - Tab order and focus management
 * - Arrow key navigation in lists
 * - Keyboard shortcuts
 * - Focus trapping in modals
 * - Roving tabindex
 */

import React, { useState } from 'react';
import {
  useKeyboardNavigation,
  useListKeyboardNavigation,
  useFocusTrap,
  useRovingTabIndex,
  useKeyboardShortcuts,
} from '../../hooks/useKeyboardNavigation';

export const KeyboardNavigationDemo: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shortcutMessage, setShortcutMessage] = useState('');

  // Example 1: Simple button with keyboard support
  const buttonKeyboard = useKeyboardNavigation({
    onActivate: () => alert('Button activated with keyboard!'),
  });

  // Example 2: List navigation with arrow keys
  const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
  const listNavigation = useListKeyboardNavigation(items.length, {
    onSelect: (index) => setSelectedItem(index),
    orientation: 'vertical',
    loop: true,
  });

  // Example 3: Horizontal tab navigation with roving tabindex
  const tabs = ['Home', 'Profile', 'Settings', 'Help'];
  const [activeTab, setActiveTab] = useState(0);
  const tabNavigation = useRovingTabIndex(tabs.length, {
    defaultIndex: 0,
    orientation: 'horizontal',
  });

  // Example 4: Focus trap for modal
  const modalRef = useFocusTrap(isModalOpen);

  // Example 5: Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+k': () => {
      setShortcutMessage('Ctrl+K pressed!');
      setTimeout(() => setShortcutMessage(''), 2000);
    },
    'ctrl+shift+p': () => {
      setShortcutMessage('Ctrl+Shift+P pressed!');
      setTimeout(() => setShortcutMessage(''), 2000);
    },
    'escape': () => {
      if (isModalOpen) setIsModalOpen(false);
    },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-4">Keyboard Navigation Demo</h1>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Keyboard Shortcuts:</h2>
        <ul className="text-sm space-y-1">
          <li>• <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">Tab</kbd> - Navigate between elements</li>
          <li>• <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">Enter</kbd> or <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">Space</kbd> - Activate buttons</li>
          <li>• <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">Arrow Keys</kbd> - Navigate lists and tabs</li>
          <li>• <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">Ctrl+K</kbd> - Test shortcut</li>
          <li>• <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">Escape</kbd> - Close modal</li>
        </ul>
        {shortcutMessage && (
          <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded">
            {shortcutMessage}
          </div>
        )}
      </div>

      {/* Example 1: Simple Button */}
      <section className="border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">1. Simple Button with Keyboard Support</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Press Tab to focus, then Enter or Space to activate
        </p>
        <button
          {...buttonKeyboard}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
        >
          Keyboard Accessible Button
        </button>
      </section>

      {/* Example 2: List Navigation */}
      <section className="border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">2. List Navigation with Arrow Keys</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Focus the list, then use Arrow Up/Down to navigate. Press Enter to select.
        </p>
        <div
          role="listbox"
          aria-label="Example list"
          className="space-y-2"
          {...listNavigation.keyboardProps}
        >
          {items.map((item, index) => (
            <div
              key={index}
              ref={listNavigation.setItemRef(index)}
              role="option"
              aria-selected={selectedItem === index}
              tabIndex={index === 0 ? 0 : -1}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedItem === index
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
              } focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-500 focus-visible:outline-offset-2`}
              onClick={() => setSelectedItem(index)}
            >
              {item}
            </div>
          ))}
        </div>
        {selectedItem !== null && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">
            Selected: {items[selectedItem]}
          </p>
        )}
      </section>

      {/* Example 3: Tab Navigation with Roving Tabindex */}
      <section className="border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">3. Tab Navigation (Roving Tabindex)</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Use Arrow Left/Right to navigate tabs. Only one tab is in the tab order at a time.
        </p>
        <div role="tablist" aria-label="Example tabs" className="flex gap-2 mb-4">
          {tabs.map((tab, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={activeTab === index}
              aria-controls={`panel-${index}`}
              tabIndex={tabNavigation.getTabIndex(index)}
              onKeyDown={tabNavigation.handleKeyDown(index)}
              onClick={() => {
                setActiveTab(index);
                tabNavigation.setActiveIndex(index);
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              } focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-500 focus-visible:outline-offset-2`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
        >
          <p>Content for {tabs[activeTab]}</p>
        </div>
      </section>

      {/* Example 4: Modal with Focus Trap */}
      <section className="border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">4. Modal with Focus Trap</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Open the modal and try tabbing. Focus will be trapped inside. Press Escape to close.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus-visible:outline focus-visible:outline-3 focus-visible:outline-purple-500 focus-visible:outline-offset-2"
        >
          Open Modal
        </button>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            ref={modalRef as any}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
          >
            <h2 id="modal-title" className="text-2xl font-bold mb-4">
              Modal with Focus Trap
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Try pressing Tab to navigate. Focus will stay within this modal.
              Press Escape or click Cancel to close.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="First input"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-500"
              />
              <input
                type="text"
                placeholder="Second input"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-500"
              />
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-3 focus-visible:outline-gray-500 focus-visible:outline-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Confirmed!');
                    setIsModalOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Example 5: Custom Interactive Elements */}
      <section className="border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">5. Custom Interactive Elements</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Non-button elements made keyboard accessible with proper ARIA roles and tabindex
        </p>
        <div className="space-y-3">
          <div
            role="button"
            tabIndex={0}
            {...useKeyboardNavigation({
              onActivate: () => alert('Card 1 activated!'),
            })}
            className="p-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
          >
            <h3 className="font-semibold">Interactive Card 1</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This div is keyboard accessible
            </p>
          </div>
          <div
            role="button"
            tabIndex={0}
            {...useKeyboardNavigation({
              onActivate: () => alert('Card 2 activated!'),
            })}
            className="p-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
          >
            <h3 className="font-semibold">Interactive Card 2</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Press Enter or Space to activate
            </p>
          </div>
        </div>
      </section>

      {/* Accessibility Notes */}
      <section className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200">
          ✓ Accessibility Features Implemented
        </h2>
        <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
          <li>• All interactive elements are keyboard accessible</li>
          <li>• Logical tab order maintained throughout</li>
          <li>• Clear focus indicators on all focusable elements</li>
          <li>• Arrow key navigation for lists and tabs</li>
          <li>• Focus trap in modal prevents focus escape</li>
          <li>• Roving tabindex for efficient tab navigation</li>
          <li>• Keyboard shortcuts with proper handling</li>
          <li>• Proper ARIA roles and attributes</li>
          <li>• Enter and Space key activation for custom elements</li>
          <li>• Escape key to close modal</li>
        </ul>
      </section>
    </div>
  );
};

export default KeyboardNavigationDemo;
