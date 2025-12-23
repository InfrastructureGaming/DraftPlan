import { DraftObject, Vector3D } from '@/types';

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionType = 'horizontal' | 'vertical';

/**
 * Align multiple objects along a specific axis
 * Note: Object positions represent their centers
 */
export function alignObjects(
  objects: DraftObject[],
  alignment: AlignmentType
): Map<string, Vector3D> {
  if (objects.length < 2) return new Map();

  const updates = new Map<string, Vector3D>();

  switch (alignment) {
    case 'left': {
      // Align to the leftmost edge (minX - width/2)
      const minLeftEdge = Math.min(...objects.map((obj) => obj.localPosition.x - obj.dimensions.width / 2));
      objects.forEach((obj) => {
        const newX = minLeftEdge + obj.dimensions.width / 2;
        updates.set(obj.id, { ...obj.localPosition, x: newX });
      });
      break;
    }

    case 'center': {
      // Align to the average center X position
      const avgCenterX =
        objects.reduce((sum, obj) => sum + obj.localPosition.x, 0) / objects.length;
      objects.forEach((obj) => {
        updates.set(obj.id, { ...obj.localPosition, x: avgCenterX });
      });
      break;
    }

    case 'right': {
      // Align to the rightmost edge (maxX + width/2)
      const maxRightEdge = Math.max(...objects.map((obj) => obj.localPosition.x + obj.dimensions.width / 2));
      objects.forEach((obj) => {
        const newX = maxRightEdge - obj.dimensions.width / 2;
        updates.set(obj.id, { ...obj.localPosition, x: newX });
      });
      break;
    }

    case 'top': {
      // Align to the topmost edge (maxY + height/2)
      const maxTopEdge = Math.max(...objects.map((obj) => obj.localPosition.y + obj.dimensions.height / 2));
      objects.forEach((obj) => {
        const newY = maxTopEdge - obj.dimensions.height / 2;
        updates.set(obj.id, { ...obj.localPosition, y: newY });
      });
      break;
    }

    case 'middle': {
      // Align to the average center Y position
      const avgCenterY =
        objects.reduce((sum, obj) => sum + obj.localPosition.y, 0) / objects.length;
      objects.forEach((obj) => {
        updates.set(obj.id, { ...obj.localPosition, y: avgCenterY });
      });
      break;
    }

    case 'bottom': {
      // Align to the bottommost edge (minY - height/2)
      const minBottomEdge = Math.min(...objects.map((obj) => obj.localPosition.y - obj.dimensions.height / 2));
      objects.forEach((obj) => {
        const newY = minBottomEdge + obj.dimensions.height / 2;
        updates.set(obj.id, { ...obj.localPosition, y: newY });
      });
      break;
    }
  }

  return updates;
}

/**
 * Distribute objects evenly along an axis
 * Note: Object positions represent their centers
 */
export function distributeObjects(
  objects: DraftObject[],
  distribution: DistributionType
): Map<string, Vector3D> {
  if (objects.length < 3) return new Map();

  const updates = new Map<string, Vector3D>();

  if (distribution === 'horizontal') {
    // Sort by X position (center)
    const sorted = [...objects].sort((a, b) => a.localPosition.x - b.localPosition.x);

    // Calculate edges
    const leftmostCenter = sorted[0].localPosition.x;
    const rightmostCenter = sorted[sorted.length - 1].localPosition.x;
    const totalCenterSpan = rightmostCenter - leftmostCenter;

    if (sorted.length === 2 || totalCenterSpan === 0) return new Map();

    // Calculate even spacing between centers
    const centerGap = totalCenterSpan / (sorted.length - 1);

    // Distribute with equal gaps
    sorted.forEach((obj, index) => {
      if (index === 0 || index === sorted.length - 1) {
        // Keep first and last objects in place
        return;
      }
      const newX = leftmostCenter + (index * centerGap);
      updates.set(obj.id, { ...obj.localPosition, x: newX });
    });
  } else if (distribution === 'vertical') {
    // Sort by Y position (center)
    const sorted = [...objects].sort((a, b) => a.localPosition.y - b.localPosition.y);

    // Calculate edges
    const bottommostCenter = sorted[0].localPosition.y;
    const topmostCenter = sorted[sorted.length - 1].localPosition.y;
    const totalCenterSpan = topmostCenter - bottommostCenter;

    if (sorted.length === 2 || totalCenterSpan === 0) return new Map();

    // Calculate even spacing between centers
    const centerGap = totalCenterSpan / (sorted.length - 1);

    // Distribute with equal gaps
    sorted.forEach((obj, index) => {
      if (index === 0 || index === sorted.length - 1) {
        // Keep first and last objects in place
        return;
      }
      const newY = bottommostCenter + (index * centerGap);
      updates.set(obj.id, { ...obj.localPosition, y: newY });
    });
  }

  return updates;
}
