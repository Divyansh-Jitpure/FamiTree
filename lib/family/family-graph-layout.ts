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
        const xA = dagreGraph.node(aId)?.x ?? 0;
        const xB = dagreGraph.node(bId)?.x ?? 0;
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

  // Map edges for React Flow
  const edges: Edge[] = inferredRelationships.map((rel) => {
    const isSpouse =
      rel.type.toLowerCase().includes("spouse") ||
      rel.type.toLowerCase().includes("patni") ||
      rel.type.toLowerCase().includes("pati") ||
      rel.type.toLowerCase().includes("wife") ||
      rel.type.toLowerCase().includes("husband");
    const isSibling =
      !isSpouse &&
      (rel.type.toLowerCase().includes("sibling") ||
        rel.type.toLowerCase().includes("brother") ||
        rel.type.toLowerCase().includes("sister") ||
        rel.type.toLowerCase().includes("bhai") ||
        rel.type.toLowerCase().includes("behen"));

    let sourceId = rel.fromId;
    let targetId = rel.toId;

    if (isSibling) {
      const xFrom = dagreGraph.node(rel.fromId)?.x ?? 0;
      const xTo = dagreGraph.node(rel.toId)?.x ?? 0;
      if (xFrom > xTo) {
        sourceId = rel.toId;
        targetId = rel.fromId;
      }
    }

    const sourceHandle = isSpouse || isSibling ? "right" : "bottom";
    const targetHandle = isSpouse || isSibling ? "left" : "top";

    return {
      id: rel.id,
      source: sourceId,
      target: targetId,
      sourceHandle,
      targetHandle,
      label: rel.type,
      type: "smoothstep",
      animated: isSpouse,
      style: {
        stroke: isSpouse ? "#e11d48" : isSibling ? "#8b5cf6" : "#2563eb",
        strokeWidth: 2,
        strokeDasharray: isSibling ? "4,4" : undefined,
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

  return { nodes, edges };
}
