import { useMemo, useRef, useEffect } from 'react';

interface RichTextDisplayProps {
  content: string;
  showChecklistCount?: boolean;
  onContentChange?: (newContent: string) => void;
  editable?: boolean;
}

export default function RichTextDisplay({ 
  content, 
  showChecklistCount = true,
  onContentChange,
  editable = false
}: RichTextDisplayProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Parse HTML to count checkboxes
  const checklistStats = useMemo(() => {
    if (!content || !showChecklistCount) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const checkboxes = doc.querySelectorAll('input[type="checkbox"]');
    
    if (checkboxes.length === 0) return null;

    const checked = Array.from(checkboxes).filter(cb => cb.hasAttribute('checked')).length;
    const total = checkboxes.length;

    return { checked, total };
  }, [content, showChecklistCount]);

  // Make checkboxes interactive if editable
  useEffect(() => {
    if (!editable || !onContentChange || !contentRef.current) return;

    const handleCheckboxChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'checkbox') {
        // Update the HTML content with the new checkbox state
        const newContent = contentRef.current?.innerHTML || content;
        onContentChange(newContent);
      }
    };

    const element = contentRef.current;
    element.addEventListener('change', handleCheckboxChange);

    return () => {
      element.removeEventListener('change', handleCheckboxChange);
    };
  }, [editable, onContentChange, content]);

  if (!content || content === '<p></p>') {
    return null;
  }

  return (
    <div>
      {checklistStats && (
        <div className="flex items-center gap-2 mb-2 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>
              {checklistStats.checked} / {checklistStats.total} completed
            </span>
          </div>
          {checklistStats.checked === checklistStats.total && checklistStats.total > 0 && (
            <span className="text-green-600 dark:text-green-400 text-xs font-medium">
              ✓ All done!
            </span>
          )}
        </div>
      )}
      <div 
        ref={contentRef}
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
