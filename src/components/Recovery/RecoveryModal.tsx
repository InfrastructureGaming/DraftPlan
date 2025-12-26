import { useUIStore } from '@/stores/uiStore';

interface RecoveryModalProps {
  onRecover: () => void;
  onDismiss: () => void;
}

export function RecoveryModal({ onRecover, onDismiss }: RecoveryModalProps) {
  const { theme } = useUIStore();

  // Theme-based colors
  const colors = {
    backdrop: 'bg-black bg-opacity-50',
    modalBg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-600',
  };

  return (
    <div className={`fixed inset-0 ${colors.backdrop} flex items-center justify-center z-50 p-4`}>
      <div className={`${colors.modalBg} rounded-lg shadow-2xl border ${colors.border} w-full max-w-md`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${colors.border}`}>
          <h2 className={`text-lg font-semibold ${colors.text}`}>
            Unsaved Work Detected
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className={`text-sm ${colors.text}`}>
            It looks like DraftPlan didn't close properly last time. We found an auto-saved version of your work.
          </p>
          <p className={`text-sm ${colors.textMuted}`}>
            Would you like to recover your unsaved changes?
          </p>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${colors.border} flex items-center justify-end gap-3`}>
          <button
            onClick={onDismiss}
            className={`px-4 py-2 text-sm rounded border ${colors.border} ${colors.text} hover:bg-opacity-10 hover:bg-white transition-colors`}
          >
            Discard
          </button>
          <button
            onClick={onRecover}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Recover
          </button>
        </div>
      </div>
    </div>
  );
}
