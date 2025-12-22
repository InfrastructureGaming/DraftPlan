import jsPDF from 'jspdf';
import { ViewType, ProjectInfo } from '@/types';

/**
 * Capture the current Three.js renderer output as a data URL
 */
export function captureCanvasAsDataURL(renderer: THREE.WebGLRenderer): string {
  return renderer.domElement.toDataURL('image/png');
}

/**
 * Download a data URL as a PNG file
 */
export function downloadPNG(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  link.click();
}

/**
 * Capture a single view and return as data URL
 */
export async function captureView(
  renderer: THREE.WebGLRenderer,
  viewType: ViewType,
  setView: (view: ViewType) => void,
  currentView: ViewType
): Promise<{ dataURL: string; viewType: ViewType }> {
  // Switch to the desired view
  if (currentView !== viewType) {
    setView(viewType);
    // Wait for view to update and render - increased delay for reliable rendering
    await new Promise(resolve => setTimeout(resolve, 300));
  } else {
    // Even if we're already on the right view, wait a bit to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Capture the canvas
  const dataURL = captureCanvasAsDataURL(renderer);

  return { dataURL, viewType };
}

/**
 * Export current view as PNG
 */
export async function exportCurrentViewAsPNG(
  renderer: THREE.WebGLRenderer,
  projectName: string,
  currentView: ViewType,
  setView: (view: ViewType) => void
): Promise<void> {
  // Capture the current view with proper rendering delay
  const { dataURL } = await captureView(renderer, currentView, setView, currentView);
  const filename = `${projectName}_${currentView}.png`;
  downloadPNG(dataURL, filename);
}

/**
 * Export multiple views as a multi-page PDF
 */
export async function exportMultiViewPDF(
  renderer: THREE.WebGLRenderer,
  setView: (view: ViewType) => void,
  currentView: ViewType,
  projectInfo: ProjectInfo,
  views: ViewType[] = ['front', 'top', 'right', 'iso-front-right']
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const imageWidth = pageWidth - 2 * margin;
  const imageHeight = pageHeight - 2 * margin - 20; // Leave space for labels

  // Capture each view
  for (let i = 0; i < views.length; i++) {
    const view = views[i];

    // Add new page for views after the first
    if (i > 0) {
      pdf.addPage();
    }

    // Capture the view
    const { dataURL } = await captureView(renderer, view, setView, currentView);

    // Add project title
    pdf.setFontSize(16);
    pdf.text(projectInfo.name, margin, margin);

    // Add view label
    pdf.setFontSize(12);
    const viewLabel = getViewDisplayName(view);
    pdf.text(`View: ${viewLabel}`, margin, margin + 7);

    // Add image
    pdf.addImage(dataURL, 'PNG', margin, margin + 12, imageWidth, imageHeight, undefined, 'FAST');

    // Add page number
    pdf.setFontSize(10);
    pdf.text(`Page ${i + 1} of ${views.length}`, pageWidth - margin - 20, pageHeight - 5);
  }

  // Restore original view
  if (currentView !== views[views.length - 1]) {
    setView(currentView);
  }

  // Download PDF
  const filename = `${projectInfo.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  pdf.save(filename);
}

/**
 * Get display name for a view type
 */
function getViewDisplayName(view: ViewType): string {
  if (view.startsWith('iso-')) {
    const parts = view.replace('iso-', '').split('-');
    return 'Isometric ' + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-');
  }
  return view.charAt(0).toUpperCase() + view.slice(1);
}
