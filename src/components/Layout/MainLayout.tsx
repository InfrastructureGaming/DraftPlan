import { Canvas } from '@/components/Canvas/Canvas';
import { ViewSwitcher } from './ViewSwitcher';
import { AlignmentToolbar } from './AlignmentToolbar';
import { AppMenu } from './AppMenu';
import { ViewOptionsMenu } from './ViewOptionsMenu';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { LibraryPanel } from '@/components/Library/LibraryPanel';
import { PropertiesPanel } from '@/components/Properties/PropertiesPanel';
import { AssembliesPanel } from '@/components/Assemblies/AssembliesPanel';
import { CutListModal } from '@/components/CutList/CutListModal';
import { useUIStore } from '@/stores/uiStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function MainLayout() {
  const { libraryPanelOpen, propertiesPanelOpen, assembliesPanelOpen, cutListModalOpen, theme } = useUIStore();

  // Enable global keyboard shortcuts
  useKeyboardShortcuts();

  // Theme-based colors with better contrast between UI and canvas
  const colors = {
    bg: theme === 'dark' ? 'bg-[#1a1a1a]' : theme === 'blueprint' ? 'bg-[#051938]' : 'bg-gray-200',
    panelBg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
    toolbarBg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-600',
  };

  return (
    <div className={`h-screen w-screen flex flex-col ${colors.bg}`}>
      {/* Toolbar */}
      <div className={`h-12 ${colors.toolbarBg} border-b ${colors.border} flex items-center px-4 gap-4 shadow-sm`}>
        <AppMenu />
        <ViewOptionsMenu />
        <div className="flex-1" />
        <AlignmentToolbar />
        <ViewSwitcher />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel (Library) */}
        {libraryPanelOpen && (
          <div className={`w-64 ${colors.panelBg} border-r ${colors.border}`}>
            <LibraryPanel />
          </div>
        )}

        {/* Canvas Area */}
        <div className={`flex-1 flex flex-col ${colors.bg}`}>
          <div className="flex-1 p-4">
            <Canvas />
          </div>
        </div>

        {/* Right Panel (Properties + Assemblies) */}
        {(propertiesPanelOpen || assembliesPanelOpen) && (
          <div className={`w-64 ${colors.panelBg} border-l ${colors.border} flex flex-col`}>
            {propertiesPanelOpen && (
              <div className="flex-1 overflow-hidden">
                <PropertiesPanel />
              </div>
            )}
            {assembliesPanelOpen && (
              <div className={`flex-1 overflow-hidden ${propertiesPanelOpen ? `border-t ${colors.border}` : ''}`}>
                <AssembliesPanel />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className={`h-8 ${colors.toolbarBg} border-t ${colors.border} flex items-center px-4 text-xs ${colors.textMuted}`}>
        <span>Ready</span>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp />

      {/* Cut List Modal */}
      {cutListModalOpen && <CutListModal />}
    </div>
  );
}
