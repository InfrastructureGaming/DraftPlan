import { useEffect, useState } from 'react';

interface ShortcutSection {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modKey = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS: ShortcutSection[] = [
  {
    title: 'File',
    shortcuts: [
      { keys: `${modKey}+N`, description: 'New Project' },
      { keys: `${modKey}+O`, description: 'Open Project' },
      { keys: `${modKey}+S`, description: 'Save Project' },
      { keys: `${modKey}+Shift+S`, description: 'Save As...' },
    ],
  },
  {
    title: 'Edit',
    shortcuts: [
      { keys: `${modKey}+Z`, description: 'Undo' },
      { keys: `${modKey}+Shift+Z`, description: 'Redo' },
      { keys: `${modKey}+Y`, description: 'Redo (alternative)' },
      { keys: 'Delete', description: 'Delete selected objects' },
      { keys: 'Backspace', description: 'Delete selected objects' },
      { keys: 'Esc', description: 'Clear selection' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: '1', description: 'Front View' },
      { keys: '2', description: 'Back View' },
      { keys: '3', description: 'Left View' },
      { keys: '4', description: 'Right View' },
      { keys: '5', description: 'Top View' },
      { keys: '6', description: 'Bottom View' },
      { keys: `${modKey}+'`, description: 'Toggle Grid' },
      { keys: `${modKey}+R`, description: 'Toggle Rulers' },
    ],
  },
  {
    title: 'Panels',
    shortcuts: [
      { keys: `${modKey}+L`, description: 'Toggle Library Panel' },
      { keys: `${modKey}+P`, description: 'Toggle Properties Panel' },
    ],
  },
  {
    title: 'Help',
    shortcuts: [
      { keys: '?', description: 'Show this help' },
    ],
  },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Show help with '?' key
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }

      // Close with Escape key
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">Keyboard Shortcuts</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SHORTCUTS.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{section.title}</h3>
                <div className="space-y-2">
                  {section.shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded">?</kbd> or{' '}
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
