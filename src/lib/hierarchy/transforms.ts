import { DraftObject, Assembly, Vector3D, WorldTransform, TreeNode } from '@/types';

/**
 * Compute absolute world transform by traversing the parent hierarchy
 * and composing local transforms
 */
export function computeWorldTransform(
  nodeId: string,
  objects: DraftObject[],
  assemblies: Assembly[]
): WorldTransform {
  const node = findNode(nodeId, objects, assemblies);
  if (!node) {
    return { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } };
  }

  // If node is an assembly, it doesn't have a position - return zero transform
  if ('childIds' in node) {
    return { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } };
  }

  // Base case: no parent, local position IS world position
  if (!node.parentId) {
    return {
      position: { ...node.localPosition },
      rotation: { ...node.rotation },
    };
  }

  // Recursive case: get parent's world transform
  const parentTransform = computeWorldTransform(node.parentId, objects, assemblies);

  // Compose transforms: parent world transform + this node's local transform
  const worldPosition = addVectors(parentTransform.position, node.localPosition);

  // Rotation composes additively (simplified - no quaternions for now)
  const worldRotation = addVectors(parentTransform.rotation, node.rotation);

  return {
    position: worldPosition,
    rotation: worldRotation,
  };
}

/**
 * Convert world position to local position relative to parent
 */
export function worldToLocalPosition(
  worldPos: Vector3D,
  parentId: string | undefined,
  objects: DraftObject[],
  assemblies: Assembly[]
): Vector3D {
  if (!parentId) {
    // No parent - world position IS local position
    return { ...worldPos };
  }

  // Get parent's world transform
  const parentTransform = computeWorldTransform(parentId, objects, assemblies);

  // Subtract parent's world position to get local offset
  return subtractVectors(worldPos, parentTransform.position);
}

/**
 * Get all descendants of a node (recursive, breadth-first)
 */
export function getDescendants(
  nodeId: string,
  objects: DraftObject[],
  assemblies: Assembly[]
): string[] {
  const node = findNode(nodeId, objects, assemblies);
  if (!node) return [];

  const descendants: string[] = [];
  const queue: string[] = [nodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentNode = findNode(currentId, objects, assemblies);

    if (!currentNode) continue;

    // If it's an assembly, add its children to the queue
    if ('childIds' in currentNode) {
      currentNode.childIds.forEach((childId) => {
        descendants.push(childId);
        queue.push(childId);
      });
    }

    // If it's an object with children (objects can parent other objects), add them
    if ('localPosition' in currentNode) {
      const childObjects = objects.filter((obj) => obj.parentId === currentId);
      const childAssemblies = assemblies.filter((asm) => asm.parentId === currentId);

      [...childObjects, ...childAssemblies].forEach((child) => {
        descendants.push(child.id);
        queue.push(child.id);
      });
    }
  }

  return descendants;
}

/**
 * Get all ancestors of a node (recursive, bottom-up)
 */
export function getAncestors(
  nodeId: string,
  objects: DraftObject[],
  assemblies: Assembly[]
): string[] {
  const node = findNode(nodeId, objects, assemblies);
  if (!node) return [];

  const ancestors: string[] = [];
  let currentNode = node;

  while (currentNode.parentId) {
    ancestors.push(currentNode.parentId);
    const parentNode = findNode(currentNode.parentId, objects, assemblies);
    if (!parentNode) break;
    currentNode = parentNode;
  }

  return ancestors;
}

/**
 * Check if node is visible (accounting for parent visibility cascade)
 */
export function isNodeVisible(
  nodeId: string,
  objects: DraftObject[],
  assemblies: Assembly[]
): boolean {
  const node = findNode(nodeId, objects, assemblies);
  if (!node) return false;

  // Get all ancestors
  const ancestors = getAncestors(nodeId, objects, assemblies);

  // Check if any ancestor assembly is hidden
  for (const ancestorId of ancestors) {
    const ancestor = assemblies.find((a) => a.id === ancestorId);
    if (ancestor && !ancestor.visible) {
      return false; // Parent is hidden, so this node is hidden
    }
  }

  // Check if this node itself is hidden (if it's an assembly)
  if ('visible' in node && !node.visible) {
    return false;
  }

  return true;
}

/**
 * Get effective color for an object (with useAssemblyColor logic)
 */
export function getEffectiveColor(
  objectId: string,
  objects: DraftObject[],
  assemblies: Assembly[]
): string | null {
  const object = objects.find((obj) => obj.id === objectId);
  if (!object || !object.useAssemblyColor) {
    return null; // Use object's default color
  }

  // Find the nearest parent assembly
  const ancestors = getAncestors(objectId, objects, assemblies);
  for (const ancestorId of ancestors) {
    const assembly = assemblies.find((a) => a.id === ancestorId);
    if (assembly) {
      return assembly.color; // Return first ancestor assembly's color
    }
  }

  return null; // No parent assembly found
}

/**
 * Validate hierarchy to prevent cycles and check depth limit
 */
export function validateHierarchy(
  nodeId: string,
  newParentId: string | undefined,
  objects: DraftObject[],
  assemblies: Assembly[]
): { valid: boolean; error?: string } {
  // No parent is always valid
  if (!newParentId) {
    return { valid: true };
  }

  // Can't parent to self
  if (nodeId === newParentId) {
    return { valid: false, error: 'Cannot parent node to itself' };
  }

  // Check if newParentId is a descendant of nodeId (would create cycle)
  const descendants = getDescendants(nodeId, objects, assemblies);
  if (descendants.includes(newParentId)) {
    return { valid: false, error: 'Cannot parent to own descendant (would create cycle)' };
  }

  // Check depth limit (128 levels)
  const ancestors = getAncestors(newParentId, objects, assemblies);
  if (ancestors.length >= 128) {
    return { valid: false, error: 'Maximum hierarchy depth (128 levels) reached' };
  }

  return { valid: true };
}

/**
 * Build tree structure for UI rendering
 */
export function buildHierarchyTree(
  objects: DraftObject[],
  assemblies: Assembly[]
): TreeNode[] {
  // Find all root nodes (nodes with no parent)
  const rootObjects = objects.filter((obj) => !obj.parentId);
  const rootAssemblies = assemblies.filter((asm) => !asm.parentId);

  const buildNodeTree = (id: string, depth: number): TreeNode | null => {
    const object = objects.find((obj) => obj.id === id);
    const assembly = assemblies.find((asm) => asm.id === id);
    const node = object || assembly;

    if (!node) return null;

    const children: TreeNode[] = [];

    // If it's an assembly, build children from childIds
    if (assembly) {
      assembly.childIds.forEach((childId) => {
        const childNode = buildNodeTree(childId, depth + 1);
        if (childNode) children.push(childNode);
      });
    }

    // If it's an object, find any objects parented to it
    if (object) {
      const childObjects = objects.filter((obj) => obj.parentId === id);
      const childAssemblies = assemblies.filter((asm) => asm.parentId === id);

      [...childObjects, ...childAssemblies].forEach((child) => {
        const childNode = buildNodeTree(child.id, depth + 1);
        if (childNode) children.push(childNode);
      });
    }

    return {
      id: node.id,
      type: assembly ? 'assembly' : 'object',
      name: node.name,
      children,
      depth,
      isExpanded: assembly?.isExpanded,
    };
  };

  const rootNodes: TreeNode[] = [];

  // Build tree for root assemblies
  rootAssemblies.forEach((asm) => {
    const node = buildNodeTree(asm.id, 0);
    if (node) rootNodes.push(node);
  });

  // Build tree for root objects
  rootObjects.forEach((obj) => {
    const node = buildNodeTree(obj.id, 0);
    if (node) rootNodes.push(node);
  });

  return rootNodes;
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

/**
 * Add two Vector3D objects
 */
function addVectors(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  };
}

/**
 * Subtract two Vector3D objects (a - b)
 */
function subtractVectors(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}
