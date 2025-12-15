import { LumberLibraryItem } from '@/types';

/**
 * Standard lumber library with common dimensional lumber and sheet goods
 * Based on actual dimensions (not nominal sizes)
 */

export const LUMBER_LIBRARY: LumberLibraryItem[] = [
  // Dimensional Lumber - 8 foot lengths
  {
    id: 'lib-1x3-96',
    nominalName: '1×3',
    actualDimensions: { width: 0.75, height: 2.5, depth: 96 },
    material: 'pine',
    category: 'Dimensional Lumber',
    tags: ['framing', 'trim', '8ft'],
    isCustom: false,
  },
  {
    id: 'lib-2x3-96',
    nominalName: '2×3',
    actualDimensions: { width: 1.5, height: 2.5, depth: 96 },
    material: 'pine',
    category: 'Dimensional Lumber',
    tags: ['framing', 'stud', '8ft'],
    isCustom: false,
  },
  {
    id: 'lib-2x4-96',
    nominalName: '2×4',
    actualDimensions: { width: 1.5, height: 3.5, depth: 96 },
    material: 'pine',
    category: 'Dimensional Lumber',
    tags: ['framing', 'stud', 'common', '8ft'],
    isCustom: false,
  },
  {
    id: 'lib-2x6-96',
    nominalName: '2×6',
    actualDimensions: { width: 1.5, height: 5.5, depth: 96 },
    material: 'pine',
    category: 'Dimensional Lumber',
    tags: ['framing', 'joist', '8ft'],
    isCustom: false,
  },
  {
    id: 'lib-4x4-96',
    nominalName: '4×4',
    actualDimensions: { width: 3.5, height: 3.5, depth: 96 },
    material: 'pine',
    category: 'Dimensional Lumber',
    tags: ['post', 'structural', '8ft'],
    isCustom: false,
  },

  // Dimensional Lumber - 10 foot lengths
  {
    id: 'lib-1x3-120',
    nominalName: '1×3',
    actualDimensions: { width: 0.75, height: 2.5, depth: 120 },
    material: 'pine',
    category: 'Dimensional Lumber',
    tags: ['framing', 'trim', '10ft'],
    isCustom: false,
  },
  {
    id: 'lib-2x3-120',
    nominalName: '2×3',
    actualDimensions: { width: 1.5, height: 2.5, depth: 120 },
    material: 'pine',
    category: 'Dimensional Lumber',
    tags: ['framing', 'stud', '10ft'],
    isCustom: false,
  },
  {
    id: 'lib-2x4-120',
    nominalName: '2×4',
    actualDimensions: { width: 1.5, height: 3.5, depth: 120 },
    material: 'pine',
    category: 'Dimensional Lumber',
    tags: ['framing', 'stud', 'common', '10ft'],
    isCustom: false,
  },
  {
    id: 'lib-2x6-120',
    nominalName: '2×6',
    actualDimensions: { width: 1.5, height: 5.5, depth: 120 },
    material: 'pine',
    category: 'Dimensional Lumber',
    tags: ['framing', 'joist', '10ft'],
    isCustom: false,
  },
  {
    id: 'lib-4x4-120',
    nominalName: '4×4',
    actualDimensions: { width: 3.5, height: 3.5, depth: 120 },
    material: 'pine',
    category: 'Dimensional Lumber',
    tags: ['post', 'structural', '10ft'],
    isCustom: false,
  },

  // Sheet Goods - 4×8 sheets
  {
    id: 'lib-ply-3_8',
    nominalName: 'Plywood 3/8"',
    actualDimensions: { width: 48, height: 96, depth: 0.375 },
    material: 'plywood',
    category: 'Sheet Goods',
    tags: ['sheet', 'panel', 'backing'],
    isCustom: false,
  },
  {
    id: 'lib-ply-1_2',
    nominalName: 'Plywood 1/2"',
    actualDimensions: { width: 48, height: 96, depth: 0.5 },
    material: 'plywood',
    category: 'Sheet Goods',
    tags: ['sheet', 'panel', 'common'],
    isCustom: false,
  },
  {
    id: 'lib-ply-3_4',
    nominalName: 'Plywood 3/4"',
    actualDimensions: { width: 48, height: 96, depth: 0.75 },
    material: 'plywood',
    category: 'Sheet Goods',
    tags: ['sheet', 'panel', 'structural'],
    isCustom: false,
  },
];

/**
 * Get lumber items by category
 */
export function getLumberByCategory(category: string): LumberLibraryItem[] {
  return LUMBER_LIBRARY.filter((item) => item.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  const categories = new Set(LUMBER_LIBRARY.map((item) => item.category));
  return Array.from(categories);
}

/**
 * Search lumber by tag or name
 */
export function searchLumber(query: string): LumberLibraryItem[] {
  const lowerQuery = query.toLowerCase();
  return LUMBER_LIBRARY.filter(
    (item) =>
      item.nominalName.toLowerCase().includes(lowerQuery) ||
      item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      item.material.toLowerCase().includes(lowerQuery)
  );
}
