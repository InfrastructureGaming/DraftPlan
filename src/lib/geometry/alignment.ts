import { DraftObject, Vector3D } from '@/types';

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionType = 'horizontal' | 'vertical';

/**
 * Align multiple objects along a specific axis
 */
export function alignObjects(
  objects: DraftObject[],
  alignment: AlignmentType
): Map<string, Vector3D> {
  if (objects.length < 2) return new Map();

  const updates = new Map<string, Vector3D>();

  switch (alignment) {
    case 'left': {
      // Align to the leftmost X position
      const minX = Math.min(...objects.map((obj) => obj.position.x));
      objects.forEach((obj) => {
        updates.set(obj.id, { ...obj.position, x: minX });
      });
      break;
    }

    case 'center': {
      // Align to the average X position (accounting for width)
      const avgCenterX =
        objects.reduce((sum, obj) => sum + obj.position.x + obj.dimensions.width / 2, 0) /
        objects.length;
      objects.forEach((obj) => {
        updates.set(obj.id, { ...obj.position, x: avgCenterX - obj.dimensions.width / 2 });
      });
      break;
    }

    case 'right': {
      // Align to the rightmost X position
      const maxX = Math.max(
        ...objects.map((obj) => obj.position.x + obj.dimensions.width)
      );
      objects.forEach((obj) => {
        updates.set(obj.id, { ...obj.position, x: maxX - obj.dimensions.width });
      });
      break;
    }

    case 'top': {
      // Align to the topmost Y position
      const maxY = Math.max(
        ...objects.map((obj) => obj.position.y + obj.dimensions.height)
      );
      objects.forEach((obj) => {
        updates.set(obj.id, { ...obj.position, y: maxY - obj.dimensions.height });
      });
      break;
    }

    case 'middle': {
      // Align to the average Y position (accounting for height)
      const avgCenterY =
        objects.reduce((sum, obj) => sum + obj.position.y + obj.dimensions.height / 2, 0) /
        objects.length;
      objects.forEach((obj) => {
        updates.set(obj.id, { ...obj.position, y: avgCenterY - obj.dimensions.height / 2 });
      });
      break;
    }

    case 'bottom': {
      // Align to the bottommost Y position
      const minY = Math.min(...objects.map((obj) => obj.position.y));
      objects.forEach((obj) => {
        updates.set(obj.id, { ...obj.position, y: minY });
      });
      break;
    }
  }

  return updates;
}

/**
 * Distribute objects evenly along an axis
 */
export function distributeObjects(
  objects: DraftObject[],
  distribution: DistributionType
): Map<string, Vector3D> {
  if (objects.length < 3) return new Map();

  const updates = new Map<string, Vector3D>();

  if (distribution === 'horizontal') {
    // Sort by X position
    const sorted = [...objects].sort((a, b) => a.position.x - b.position.x);

    // Calculate total space between objects
    const leftmost = sorted[0].position.x;
    const rightmost = sorted[sorted.length - 1].position.x + sorted[sorted.length - 1].dimensions.width;
    const totalWidth = sorted.reduce((sum, obj) => sum + obj.dimensions.width, 0);
    const totalGap = rightmost - leftmost - totalWidth;
    const gap = totalGap / (sorted.length - 1);

    // Distribute with equal gaps
    let currentX = leftmost + sorted[0].dimensions.width + gap;
    sorted.forEach((obj, index) => {
      if (index === 0 || index === sorted.length - 1) {
        // Keep first and last objects in place
        return;
      }
      updates.set(obj.id, { ...obj.position, x: currentX });
      currentX += obj.dimensions.width + gap;
    });
  } else if (distribution === 'vertical') {
    // Sort by Y position
    const sorted = [...objects].sort((a, b) => a.position.y - b.position.y);

    // Calculate total space between objects
    const bottommost = sorted[0].position.y;
    const topmost = sorted[sorted.length - 1].position.y + sorted[sorted.length - 1].dimensions.height;
    const totalHeight = sorted.reduce((sum, obj) => sum + obj.dimensions.height, 0);
    const totalGap = topmost - bottommost - totalHeight;
    const gap = totalGap / (sorted.length - 1);

    // Distribute with equal gaps
    let currentY = bottommost + sorted[0].dimensions.height + gap;
    sorted.forEach((obj, index) => {
      if (index === 0 || index === sorted.length - 1) {
        // Keep first and last objects in place
        return;
      }
      updates.set(obj.id, { ...obj.position, y: currentY });
      currentY += obj.dimensions.height + gap;
    });
  }

  return updates;
}
