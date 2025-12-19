import { DraftObject } from '@/types';

export interface MaterialGroup {
  material: string;           // e.g., "Pine"
  nominalSize: string;        // e.g., "2x4", "Plywood 3/4\""
  category: string;           // "Dimensional Lumber" or "Sheet Goods"
  pieces: DraftObject[];      // All objects in this group
  quantity: number;           // Total count
  totalBoardFeet?: number;    // For lumber only
  totalLinearFeet?: number;   // For lumber only
  sheetCount?: number;        // For sheet goods only
}

/**
 * Extract nominal size from object name
 * Examples: "Pine 2x4 - 96\"" -> "2x4", "Plywood 3/4\" - 4x8" -> "3/4\""
 */
function getNominalSize(obj: DraftObject): string {
  // Try to extract from name
  const name = obj.name;

  // For dimensional lumber: look for patterns like "2x4", "4x4", etc.
  const lumberMatch = name.match(/(\d+x\d+)/);
  if (lumberMatch) {
    return lumberMatch[1];
  }

  // For sheet goods: look for thickness like "3/4\"", "1/2\"", etc.
  const sheetMatch = name.match(/(\d+\/\d+")/);
  if (sheetMatch) {
    return sheetMatch[1];
  }

  // Fallback: use dimensions
  return `${obj.dimensions.width}" × ${obj.dimensions.height}"`;
}

/**
 * Calculate board feet for a piece of lumber
 * Formula: (width × height × depth) / 144
 */
export function calculateBoardFeet(width: number, height: number, depth: number): number {
  return (width * height * depth) / 144;
}

/**
 * Calculate linear feet from a list of pieces
 * Sums all depths (lengths) and converts to feet
 */
export function calculateLinearFeet(pieces: DraftObject[]): number {
  const totalInches = pieces.reduce((sum, piece) => sum + piece.dimensions.depth, 0);
  return totalInches / 12;
}

/**
 * Calculate sheet count
 * For V1, simply count the number of pieces
 * Future: Could optimize by calculating how many pieces fit per sheet
 */
export function calculateSheetCount(pieces: DraftObject[]): number {
  return pieces.length;
}

/**
 * Group objects by material type
 * Groups by: material + nominal size
 */
export function aggregateByMaterial(objects: DraftObject[]): MaterialGroup[] {
  // Group objects
  const groups = new Map<string, MaterialGroup>();

  objects.forEach(obj => {
    const nominalSize = getNominalSize(obj);
    const key = `${obj.material}-${nominalSize}`;

    if (!groups.has(key)) {
      groups.set(key, {
        material: obj.material,
        nominalSize,
        category: obj.category,
        pieces: [],
        quantity: 0,
      });
    }

    const group = groups.get(key)!;
    group.pieces.push(obj);
    group.quantity++;
  });

  // Calculate totals for each group
  groups.forEach(group => {
    if (group.category === 'Dimensional Lumber') {
      // Calculate board feet
      group.totalBoardFeet = group.pieces.reduce((sum, piece) => {
        return sum + calculateBoardFeet(
          piece.dimensions.width,
          piece.dimensions.height,
          piece.dimensions.depth
        );
      }, 0);

      // Calculate linear feet
      group.totalLinearFeet = calculateLinearFeet(group.pieces);
    } else if (group.category === 'Sheet Goods') {
      // Calculate sheet count
      group.sheetCount = calculateSheetCount(group.pieces);
    }
  });

  // Convert map to array and sort by material then nominal size
  return Array.from(groups.values()).sort((a, b) => {
    if (a.material !== b.material) {
      return a.material.localeCompare(b.material);
    }
    return a.nominalSize.localeCompare(b.nominalSize);
  });
}
