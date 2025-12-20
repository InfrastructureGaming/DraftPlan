import { DraftObject, Assembly, Vector3D } from '@/types';
import {
  computeWorldTransform,
  worldToLocalPosition,
  getDescendants,
  validateHierarchy,
} from './transforms';

/**
 * Move a node to a new parent (updates local position to maintain world position)
 */
export function reparentNode(
  nodeId: string,
  newParentId: string | undefined,
  objects: DraftObject[],
  assemblies: Assembly[]
): { objects: DraftObject[]; assemblies: Assembly[] } {
  // Validate the reparent operation
  const validation = validateHierarchy(nodeId, newParentId, objects, assemblies);
  if (!validation.valid) {
    console.error('Reparent validation failed:', validation.error);
    return { objects, assemblies }; // Return unchanged
  }

  const node = findNode(nodeId, objects, assemblies);
  if (!node) {
    return { objects, assemblies };
  }

  const oldParentId = node.parentId;

  // Update the node based on type
  let updatedObjects = [...objects];
  let updatedAssemblies = [...assemblies];

  if ('localPosition' in node) {
    // It's a DraftObject
    // Compute current world position before changing parent
    const worldTransform = computeWorldTransform(nodeId, objects, assemblies);

    // Calculate new local position relative to new parent
    const newLocalPosition = worldToLocalPosition(
      worldTransform.position,
      newParentId,
      objects,
      assemblies
    );

    updatedObjects = objects.map((obj) =>
      obj.id === nodeId
        ? { ...obj, parentId: newParentId, localPosition: newLocalPosition }
        : obj
    );
  } else {
    // It's an Assembly
    updatedAssemblies = assemblies.map((asm) =>
      asm.id === nodeId ? { ...asm, parentId: newParentId } : asm
    );
  }

  // Update old parent's childIds (remove this node)
  if (oldParentId) {
    updatedAssemblies = updatedAssemblies.map((asm) =>
      asm.id === oldParentId
        ? { ...asm, childIds: asm.childIds.filter((id) => id !== nodeId) }
        : asm
    );
  }

  // Update new parent's childIds (add this node)
  if (newParentId) {
    updatedAssemblies = updatedAssemblies.map((asm) =>
      asm.id === newParentId && !asm.childIds.includes(nodeId)
        ? { ...asm, childIds: [...asm.childIds, nodeId] }
        : asm
    );
  }

  return { objects: updatedObjects, assemblies: updatedAssemblies };
}

/**
 * Delete a node and all its descendants recursively
 */
export function deleteNodeCascade(
  nodeId: string,
  objects: DraftObject[],
  assemblies: Assembly[]
): { objects: DraftObject[]; assemblies: Assembly[] } {
  // Get all descendants to delete
  const descendants = getDescendants(nodeId, objects, assemblies);
  const idsToDelete = [nodeId, ...descendants];

  // Remove all nodes
  const updatedObjects = objects.filter((obj) => !idsToDelete.includes(obj.id));
  const updatedAssemblies = assemblies.filter((asm) => !idsToDelete.includes(asm.id));

  // Remove nodeId from parent's childIds (if it has a parent)
  const node = findNode(nodeId, objects, assemblies);
  if (node?.parentId) {
    const finalAssemblies = updatedAssemblies.map((asm) =>
      asm.id === node.parentId
        ? { ...asm, childIds: asm.childIds.filter((id) => id !== nodeId) }
        : asm
    );
    return { objects: updatedObjects, assemblies: finalAssemblies };
  }

  return { objects: updatedObjects, assemblies: updatedAssemblies };
}

/**
 * Move a node in world space (updates local position to maintain world position)
 * This is used when dragging objects on the canvas
 */
export function moveNodeInWorldSpace(
  nodeId: string,
  worldDelta: Vector3D,
  objects: DraftObject[],
  assemblies: Assembly[]
): { objects: DraftObject[]; assemblies: Assembly[] } {
  const object = objects.find((obj) => obj.id === nodeId);
  if (!object) {
    // Only objects can be moved (assemblies don't have positions)
    return { objects, assemblies };
  }

  // Compute current world position
  const currentWorldTransform = computeWorldTransform(nodeId, objects, assemblies);

  // Calculate new world position
  const newWorldPosition: Vector3D = {
    x: currentWorldTransform.position.x + worldDelta.x,
    y: currentWorldTransform.position.y + worldDelta.y,
    z: currentWorldTransform.position.z + worldDelta.z,
  };

  // Convert new world position to local position
  const newLocalPosition = worldToLocalPosition(
    newWorldPosition,
    object.parentId,
    objects,
    assemblies
  );

  // Update the object
  const updatedObjects = objects.map((obj) =>
    obj.id === nodeId ? { ...obj, localPosition: newLocalPosition } : obj
  );

  return { objects: updatedObjects, assemblies };
}

/**
 * Add a child to an assembly's childIds array
 */
export function addChildToAssembly(
  assemblyId: string,
  childId: string,
  assemblies: Assembly[]
): Assembly[] {
  return assemblies.map((asm) =>
    asm.id === assemblyId && !asm.childIds.includes(childId)
      ? { ...asm, childIds: [...asm.childIds, childId] }
      : asm
  );
}

/**
 * Remove a child from an assembly's childIds array
 */
export function removeChildFromAssembly(
  assemblyId: string,
  childId: string,
  assemblies: Assembly[]
): Assembly[] {
  return assemblies.map((asm) =>
    asm.id === assemblyId
      ? { ...asm, childIds: asm.childIds.filter((id) => id !== childId) }
      : asm
  );
}

/**
 * Reorder children within a parent (or at root level)
 */
export function reorderChildren(
  parentId: string | undefined,
  fromIndex: number,
  toIndex: number,
  objects: DraftObject[],
  assemblies: Assembly[]
): { objects: DraftObject[]; assemblies: Assembly[] } {
  if (parentId) {
    // Reorder within an assembly
    const updatedAssemblies = assemblies.map((asm) => {
      if (asm.id === parentId) {
        const newChildIds = [...asm.childIds];
        const [removed] = newChildIds.splice(fromIndex, 1);
        newChildIds.splice(toIndex, 0, removed);
        return { ...asm, childIds: newChildIds };
      }
      return asm;
    });

    return { objects, assemblies: updatedAssemblies };
  } else {
    // Reorder at root level
    // For root level, we need to maintain a stable order
    // This is trickier because root nodes aren't stored in a childIds array
    // We'll handle this in the store layer by tracking root node order
    return { objects, assemblies };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a node (object or assembly) by ID
 */
function findNode(
  nodeId: string,
  objects: DraftObject[],
  assemblies: Assembly[]
): DraftObject | Assembly | null {
  const object = objects.find((obj) => obj.id === nodeId);
  if (object) return object;

  const assembly = assemblies.find((asm) => asm.id === nodeId);
  if (assembly) return assembly;

  return null;
}
