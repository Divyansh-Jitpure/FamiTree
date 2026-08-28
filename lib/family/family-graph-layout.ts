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

  // Add edges to dagre
  visibleRelationships.forEach((rel) => {
    dagreGraph.setEdge(rel.fromId, rel.toId);
  });

  // Perform layout
  dagre.layout(dagreGraph);

  // Map nodes with calculated position
  const nodes: Node<PersonNodeData>[] = visiblePeople.map((person) => {
    const nodeWithPos = dagreGraph.node(person.id);
    const hasConnections = relationships.some(
      (r) => r.fromId === person.id || r.toId === person.id
    );
    const isCollapsed = collapsedNodeIds.has(person.id);

    return {
      id: person.id,
      type: "personNode",
      position: {
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
  const edges: Edge[] = visibleRelationships.map((rel) => {
    const isSpouse =
      rel.type.toLowerCase().includes("spouse") ||
      rel.type.toLowerCase().includes("patni") ||
      rel.type.toLowerCase().includes("pati");

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

  return { nodes, edges };
}
