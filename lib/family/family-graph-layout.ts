import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";
import type { FamilyMemberView, FamilyRelationshipView } from "@/lib/family/types";

export type PersonNodeData = {
  id: string;
  name: string;
  role: string;
  meta: string;
  tags: string[];
  isExpanded: boolean;
  hasConnections: boolean;
  isFocus: boolean;
  onToggleExpand?: (id: string) => void;
  onSelectPerson?: (id: string) => void;
  onAddRelative?: (personId: string, type: "child" | "spouse" | "parent") => void;
  onOpenInspector?: (personId: string) => void;
};

const NODE_WIDTH = 240;
const NODE_HEIGHT = 120;

function isSideConnection(type: string): boolean {
  const lower = type.toLowerCase();
  return (
    lower.includes("spouse") ||
    lower.includes("patni") ||
    lower.includes("pati") ||
    lower.includes("wife") ||
    lower.includes("husband") ||
    lower.includes("sibling") ||
    lower.includes("brother") ||
    lower.includes("sister") ||
    lower.includes("bhai") ||
    lower.includes("behen")
  );
}

export function buildFamilyGraphLayout(
  people: FamilyMemberView[],
  relationships: FamilyRelationshipView[],
  collapsedNodeIds: Set<string>,
  focusPersonId?: string | null
): { nodes: Node<PersonNodeData>[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 50,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  // Calculate visible people based on collapsed nodes
  const hiddenNodeIds = new Set<string>();

  collapsedNodeIds.forEach((collapsedId) => {
    // Hide downstream connected nodes if collapsed
    const outgoingEdges = relationships.filter((rel) => rel.fromId === collapsedId);
    outgoingEdges.forEach((rel) => {
      // Don't hide if it's the focus person or root
      if (rel.toId !== focusPersonId) {
        hiddenNodeIds.add(rel.toId);
      }
    });
  });

  const visiblePeople = people.filter((p) => !hiddenNodeIds.has(p.id));
  const visibleRelationships = relationships.filter(
    (rel) => !hiddenNodeIds.has(rel.fromId) && !hiddenNodeIds.has(rel.toId)
  );

  // Add nodes to dagre
  visiblePeople.forEach((person) => {
    dagreGraph.setNode(person.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Add relationships to dagre
  visibleRelationships.forEach((rel) => {
    const isSide = isSideConnection(rel.type);
    if (isSide) {
      dagreGraph.setEdge(rel.fromId, rel.toId, { minlen: 0, weight: 0 });
    } else {
      dagreGraph.setEdge(rel.fromId, rel.toId, { minlen: 1, weight: 1 });
    }
  });

  // Perform layout calculation for initial X positions
  dagre.layout(dagreGraph);

  const getPersonX = (personId: string) => {
    const p = visiblePeople.find((person) => person.id === personId);
    if (p?.position?.x !== undefined) {
      return p.position.x;
    }
    const dagreNode = dagreGraph.node(personId);
    return (dagreNode?.x ?? 0) - NODE_WIDTH / 2;
  };

  // Automatically infer sibling relationships for children sharing a common parent
  const inferredRelationships = [...visibleRelationships];
  const parentToChildren = new Map<string, string[]>();

  visibleRelationships.forEach((rel) => {
    if (rel.type.toLowerCase().includes("parent")) {
      const children = parentToChildren.get(rel.fromId) || [];
      if (!children.includes(rel.toId)) children.push(rel.toId);
      parentToChildren.set(rel.fromId, children);
    }
  });

  parentToChildren.forEach((children) => {
    if (children.length > 1) {
      // Sort siblings strictly by horizontal X position (left to right)
      children.sort((aId, bId) => {
        const xA = getPersonX(aId);
        const xB = getPersonX(bId);
        return xA - xB;
      });

      // Synthesize bottom-to-bottom sibling edges between adjacent horizontal neighbors
      for (let i = 0; i < children.length - 1; i++) {
        const c1 = children[i];
        const c2 = children[i + 1];
        const p1 = visiblePeople.find((p) => p.id === c1);
        const p2 = visiblePeople.find((p) => p.id === c2);
        const exists = inferredRelationships.some(
          (r) => (r.fromId === c1 && r.toId === c2) || (r.fromId === c2 && r.toId === c1)
        );

        if (!exists && p1 && p2) {
          inferredRelationships.push({
            id: `inferred-sibling-${c1}-${c2}`,
            fromId: c1,
            toId: c2,
            fromName: p1.name,
            toName: p2.name,
            type: "Sibling of",
          });
        }
      }
    }
  });

  // Map nodes with calculated or saved position
  const nodes: Node<PersonNodeData>[] = visiblePeople.map((person) => {
    const nodeWithPos = dagreGraph.node(person.id);
    const hasConnections = relationships.some(
      (r) => r.fromId === person.id || r.toId === person.id
    );
    const isCollapsed = collapsedNodeIds.has(person.id);

    return {
      id: person.id,
      type: "personNode",
      position: person.position
        ? person.position
        : {
            x: (nodeWithPos?.x ?? 0) - NODE_WIDTH / 2,
            y: (nodeWithPos?.y ?? 0) - NODE_HEIGHT / 2,
          },
      data: {
        id: person.id,
        name: person.name,
        role: person.role,
        meta: person.meta,
        tags: person.tags,
        isExpanded: !isCollapsed,
        hasConnections,
        isFocus: person.id === focusPersonId,
      },
    };
  });

  // Filter non-sibling relationships for initial layout edge mapping
  const nonSiblingRelationships = visibleRelationships.filter((rel) => {
    const isSibling =
      !rel.type.toLowerCase().includes("spouse") &&
      !rel.type.toLowerCase().includes("patni") &&
      !rel.type.toLowerCase().includes("pati") &&
      !rel.type.toLowerCase().includes("wife") &&
      !rel.type.toLowerCase().includes("husband") &&
      (rel.type.toLowerCase().includes("sibling") ||
        rel.type.toLowerCase().includes("brother") ||
        rel.type.toLowerCase().includes("sister") ||
        rel.type.toLowerCase().includes("bhai") ||
        rel.type.toLowerCase().includes("behen"));
    return !isSibling;
  });

  // Map non-sibling edges for React Flow
  const nonSiblingEdges: Edge[] = nonSiblingRelationships.map((rel) => {
    const isSpouse =
      rel.type.toLowerCase().includes("spouse") ||
      rel.type.toLowerCase().includes("patni") ||
      rel.type.toLowerCase().includes("pati") ||
      rel.type.toLowerCase().includes("wife") ||
      rel.type.toLowerCase().includes("husband");

    return {
      id: rel.id,
      source: rel.fromId,
      target: rel.toId,
      sourceHandle: isSpouse ? "right" : "bottom",
      targetHandle: isSpouse ? "left" : "top",
      label: rel.type,
      type: "smoothstep",
      animated: isSpouse,
      style: {
        stroke: isSpouse ? "#e11d48" : "#2563eb",
        strokeWidth: 2,
      },
      labelStyle: {
        fill: "#475569",
        fontWeight: 600,
        fontSize: 11,
      },
      labelBgStyle: {
        fill: "#ffffff",
        fillOpacity: 0.9,
        rx: 6,
        ry: 6,
      },
      labelBgPadding: [6, 4],
    };
  });

  // Compute clean left-to-right sibling edges using Universal Sibling Engine
  const siblingEdges = computeSiblingEdges(nodes, visibleRelationships);

  return { nodes, edges: [...nonSiblingEdges, ...siblingEdges] };
}

export function computeSiblingEdges(
  nodes: Node<PersonNodeData>[],
  relationships: FamilyRelationshipView[]
): Edge[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const getPersonX = (id: string) => {
    const n = nodeMap.get(id);
    return (n?.position?.x ?? 0) + NODE_WIDTH / 2;
  };

  // Group children by parent bi-directionally
  const childToParents = new Map<string, Set<string>>();
  relationships.forEach((rel) => {
    const t = rel.type.toLowerCase();
    if (
      t.includes("parent") ||
      t.includes("pita") ||
      t.includes("mata") ||
      t.includes("mother") ||
      t.includes("father")
    ) {
      // fromId is Parent, toId is Child
      const parents = childToParents.get(rel.toId) || new Set();
      parents.add(rel.fromId);
      childToParents.set(rel.toId, parents);
    } else if (
      t.includes("child") ||
      t.includes("bache") ||
      t.includes("son") ||
      t.includes("daughter") ||
      t.includes("beta") ||
      t.includes("beti")
    ) {
      // fromId is Child, toId is Parent
      const parents = childToParents.get(rel.fromId) || new Set();
      parents.add(rel.toId);
      childToParents.set(rel.fromId, parents);
    }
  });

  // Group children that share at least 1 common parent
  const siblingGroups: Set<string>[] = [];
  childToParents.forEach((parents, childId) => {
    let matchedGroup = siblingGroups.find((group) =>
      Array.from(group).some((existingChild) => {
        const existingParents = childToParents.get(existingChild);
        return Array.from(parents).some((p) => existingParents?.has(p));
      })
    );
    if (matchedGroup) {
      matchedGroup.add(childId);
    } else {
      siblingGroups.push(new Set([childId]));
    }
  });

  const siblingEdges: Edge[] = [];

  // Inferred sibling edges for every parent-child family group
  siblingGroups.forEach((group) => {
    const children = Array.from(group).filter((id) => nodeMap.has(id));
    if (children.length > 1) {
      children.sort((aId, bId) => getPersonX(aId) - getPersonX(bId));

      for (let i = 0; i < children.length - 1; i++) {
        const leftId = children[i];
        const rightId = children[i + 1];
        siblingEdges.push({
          id: `inferred-sibling-${leftId}-${rightId}`,
          source: leftId,
          target: rightId,
          sourceHandle: "right",
          targetHandle: "left",
          label: "Sibling of",
          type: "smoothstep",
          style: { stroke: "#8b5cf6", strokeWidth: 2, strokeDasharray: "4,4" },
          labelStyle: { fill: "#475569", fontWeight: 600, fontSize: 11 },
          labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9, rx: 6, ry: 6 },
          labelBgPadding: [6, 4],
        });
      }
    }
  });

  // Standalone explicit sibling relationships (no parent present)
  relationships.forEach((rel) => {
    const isSibling =
      !rel.type.toLowerCase().includes("spouse") &&
      !rel.type.toLowerCase().includes("patni") &&
      !rel.type.toLowerCase().includes("pati") &&
      !rel.type.toLowerCase().includes("wife") &&
      !rel.type.toLowerCase().includes("husband") &&
      (rel.type.toLowerCase().includes("sibling") ||
        rel.type.toLowerCase().includes("brother") ||
        rel.type.toLowerCase().includes("sister") ||
        rel.type.toLowerCase().includes("bhai") ||
        rel.type.toLowerCase().includes("behen"));

    if (isSibling && nodeMap.has(rel.fromId) && nodeMap.has(rel.toId)) {
      const xFrom = getPersonX(rel.fromId);
      const xTo = getPersonX(rel.toId);
      const leftId = xFrom <= xTo ? rel.fromId : rel.toId;
      const rightId = xFrom <= xTo ? rel.toId : rel.fromId;

      const alreadyCovered = siblingEdges.some(
        (e) =>
          (e.source === leftId && e.target === rightId) ||
          (e.source === rightId && e.target === leftId)
      );

      if (!alreadyCovered) {
        siblingEdges.push({
          id: rel.id,
          source: leftId,
          target: rightId,
          sourceHandle: "right",
          targetHandle: "left",
          label: rel.type,
          type: "smoothstep",
          style: { stroke: "#8b5cf6", strokeWidth: 2, strokeDasharray: "4,4" },
          labelStyle: { fill: "#475569", fontWeight: 600, fontSize: 11 },
          labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9, rx: 6, ry: 6 },
          labelBgPadding: [6, 4],
        });
      }
    }
  });

  return siblingEdges;
}
