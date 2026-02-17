/**
 * Tests for Keyboard Navigation Accessibility Utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getFocusableElements,
  getNextFocusableElement,
  getPreviousFocusableElement,
  auditTabOrder,
  isElementFocusable,
  focusFirstElement,
  focusLastElement,
  createKeyboardHandler,
  ensureKeyboardAccessibility,
} from '../accessibility';

describe('getFocusableElements', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should find all focusable elements', () => {
    container.innerHTML = `
      <button>Button</button>
      <a href="#">Link</a>
      <input type="text" />
      <select></select>
      <textarea></textarea>
      <div tabindex="0">Focusable div</div>
      <div>Not focusable</div>
    `;

    const focusable = getFocusableElements(container);
    expect(focusable).toHaveLength(6);
  });

  it('should exclude disabled elements', () => {
    container.innerHTML = `
      <button>Enabled</button>
      <button disabled>Disabled</button>
      <input type="text" />
      <input type="text" disabled />
    `;

    const focusable = getFocusableElements(container);
    expect(focusable).toHaveLength(2);
  });

  it('should exclude elements with tabindex="-1"', () => {
    container.innerHTML = `
      <button>Button</button>
      <div tabindex="0">Focusable</div>
      <div tabindex="-1">Not focusable</div>
    `;

    const focusable = getFocusableElements(container);
    expect(focusable).toHaveLength(2);
  });

  it('should include contenteditable elements', () => {
    container.innerHTML = `
      <div contenteditable="true">Editable</div>
      <div contenteditable="false">Not editable</div>
    `;

    const focusable = getFocusableElements(container);
    expect(focusable).toHaveLength(1);
  });
});

describe('getNextFocusableElement', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should return next focusable element', () => {
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <button id="btn2">Button 2</button>
      <button id="btn3">Button 3</button>
    `;

    const btn1 = container.querySelector('#btn1') as HTMLElement;
    const btn2 = container.querySelector('#btn2') as HTMLElement;
    
    const next = getNextFocusableElement(btn1, container);
    expect(next).toBe(btn2);
  });

  it('should wrap to first element when at end', () => {
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <button id="btn2">Button 2</button>
    `;

    const btn1 = container.querySelector('#btn1') as HTMLElement;
    const btn2 = container.querySelector('#btn2') as HTMLElement;
    
    const next = getNextFocusableElement(btn2, container);
    expect(next).toBe(btn1);
  });

  it('should return null for element not in container', () => {
    container.innerHTML = `<button>Button</button>`;
    const outsideElement = document.createElement('button');
    
    const next = getNextFocusableElement(outsideElement, container);
    expect(next).toBeNull();
  });
});

describe('getPreviousFocusableElement', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should return previous focusable element', () => {
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <button id="btn2">Button 2</button>
      <button id="btn3">Button 3</button>
    `;

    const btn1 = container.querySelector('#btn1') as HTMLElement;
    const btn2 = container.querySelector('#btn2') as HTMLElement;
    
    const prev = getPreviousFocusableElement(btn2, container);
    expect(prev).toBe(btn1);
  });

  it('should wrap to last element when at beginning', () => {
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <button id="btn2">Button 2</button>
    `;

    const btn1 = container.querySelector('#btn1') as HTMLElement;
    const btn2 = container.querySelector('#btn2') as HTMLElement;
    
    const prev = getPreviousFocusableElement(btn1, container);
    expect(prev).toBe(btn2);
  });
});

describe('auditTabOrder', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should find elements with positive tabindex', () => {
    container.innerHTML = `
      <button tabindex="0">OK</button>
      <button tabindex="1">Problematic</button>
      <button tabindex="2">Also problematic</button>
      <button tabindex="-1">OK (not in tab order)</button>
    `;

    const problematic = auditTabOrder(container);
    expect(problematic).toHaveLength(2);
  });

  it('should return empty array when no issues', () => {
    container.innerHTML = `
      <button>Button</button>
      <button tabindex="0">Button</button>
      <button tabindex="-1">Button</button>
    `;

    const problematic = auditTabOrder(container);
    expect(problematic).toHaveLength(0);
  });
});

describe('isElementFocusable', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should return true for focusable elements', () => {
    container.innerHTML = `
      <button id="btn">Button</button>
      <a href="#" id="link">Link</a>
      <input id="input" type="text" />
    `;

    expect(isElementFocusable(container.querySelector('#btn')!)).toBe(true);
    expect(isElementFocusable(container.querySelector('#link')!)).toBe(true);
    expect(isElementFocusable(container.querySelector('#input')!)).toBe(true);
  });

  it('should return false for disabled elements', () => {
    container.innerHTML = `<button disabled id="btn">Button</button>`;
    expect(isElementFocusable(container.querySelector('#btn')!)).toBe(false);
  });

  it('should return false for hidden elements', () => {
    container.innerHTML = `<button style="display: none" id="btn">Button</button>`;
    expect(isElementFocusable(container.querySelector('#btn')!)).toBe(false);
  });

  it('should return false for elements with tabindex="-1"', () => {
    container.innerHTML = `<button tabindex="-1" id="btn">Button</button>`;
    expect(isElementFocusable(container.querySelector('#btn')!)).toBe(false);
  });

  it('should return true for elements with tabindex="0"', () => {
    container.innerHTML = `<div tabindex="0" id="div">Div</div>`;
    expect(isElementFocusable(container.querySelector('#div')!)).toBe(true);
  });
});

describe('focusFirstElement', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should focus first focusable element', () => {
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <button id="btn2">Button 2</button>
    `;

    const btn1 = container.querySelector('#btn1') as HTMLElement;
    const result = focusFirstElement(container);
    
    expect(result).toBe(true);
    expect(document.activeElement).toBe(btn1);
  });

  it('should return false when no focusable elements', () => {
    container.innerHTML = `<div>No focusable elements</div>`;
    
    const result = focusFirstElement(container);
    expect(result).toBe(false);
  });
});

describe('focusLastElement', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should focus last focusable element', () => {
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <button id="btn2">Button 2</button>
    `;

    const btn2 = container.querySelector('#btn2') as HTMLElement;
    const result = focusLastElement(container);
    
    expect(result).toBe(true);
    expect(document.activeElement).toBe(btn2);
  });

  it('should return false when no focusable elements', () => {
    container.innerHTML = `<div>No focusable elements</div>`;
    
    const result = focusLastElement(container);
    expect(result).toBe(false);
  });
});

describe('createKeyboardHandler', () => {
  it('should call onEnter when Enter is pressed', () => {
    const onEnter = vi.fn();
    const handler = createKeyboardHandler({ onEnter });
    
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    handler(event);
    
    expect(onEnter).toHaveBeenCalledWith(event);
  });

  it('should call onSpace when Space is pressed', () => {
    const onSpace = vi.fn();
    const handler = createKeyboardHandler({ onSpace });
    
    const event = new KeyboardEvent('keydown', { key: ' ' });
    handler(event);
    
    expect(onSpace).toHaveBeenCalledWith(event);
  });

  it('should call onEscape when Escape is pressed', () => {
    const onEscape = vi.fn();
    const handler = createKeyboardHandler({ onEscape });
    
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    handler(event);
    
    expect(onEscape).toHaveBeenCalledWith(event);
  });

  it('should call arrow key handlers', () => {
    const onArrowUp = vi.fn();
    const onArrowDown = vi.fn();
    const onArrowLeft = vi.fn();
    const onArrowRight = vi.fn();
    
    const handler = createKeyboardHandler({
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
    });
    
    handler(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    handler(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    handler(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    handler(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    
    expect(onArrowUp).toHaveBeenCalledTimes(1);
    expect(onArrowDown).toHaveBeenCalledTimes(1);
    expect(onArrowLeft).toHaveBeenCalledTimes(1);
    expect(onArrowRight).toHaveBeenCalledTimes(1);
  });

  it('should call onHome and onEnd', () => {
    const onHome = vi.fn();
    const onEnd = vi.fn();
    
    const handler = createKeyboardHandler({ onHome, onEnd });
    
    handler(new KeyboardEvent('keydown', { key: 'Home' }));
    handler(new KeyboardEvent('keydown', { key: 'End' }));
    
    expect(onHome).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('should call onTab when Tab is pressed', () => {
    const onTab = vi.fn();
    const handler = createKeyboardHandler({ onTab });
    
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    handler(event);
    
    expect(onTab).toHaveBeenCalledWith(event);
  });
});

describe('ensureKeyboardAccessibility', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should add tabindex to elements with pointer cursor', () => {
    container.innerHTML = `<div id="clickable" style="cursor: pointer">Click me</div>`;
    
    ensureKeyboardAccessibility(container);
    
    const element = container.querySelector('#clickable') as HTMLElement;
    expect(element.getAttribute('tabindex')).toBe('0');
    expect(element.getAttribute('role')).toBe('button');
  });

  it('should not modify already accessible elements', () => {
    container.innerHTML = `
      <button>Button</button>
      <a href="#">Link</a>
      <input type="text" />
    `;
    
    const originalHTML = container.innerHTML;
    ensureKeyboardAccessibility(container);
    
    // Should not add tabindex to already accessible elements
    const button = container.querySelector('button');
    const link = container.querySelector('a');
    const input = container.querySelector('input');
    
    expect(button?.hasAttribute('tabindex')).toBe(false);
    expect(link?.hasAttribute('tabindex')).toBe(false);
    expect(input?.hasAttribute('tabindex')).toBe(false);
  });

  it('should not modify elements without click handlers', () => {
    container.innerHTML = `<div id="static">Static content</div>`;
    
    ensureKeyboardAccessibility(container);
    
    const element = container.querySelector('#static') as HTMLElement;
    expect(element.hasAttribute('tabindex')).toBe(false);
  });
});
