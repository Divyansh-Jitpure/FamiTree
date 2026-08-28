"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { PersonNode } from "@/components/person-node";
import { AddMemberModal } from "@/components/add-member-modal";
import { ConnectRelationshipModal } from "@/components/connect-relationship-modal";
import { MemberInspectorModal } from "@/components/member-inspector-modal";
import {
  buildFamilyGraphLayout,
  type PersonNodeData,
} from "@/lib/family/family-graph-layout";
import type {
  FamilyMemberView,
  FamilyRelationshipView,
} from "@/lib/family/types";
import type { Dictionary } from "@/lib/i18n/config";

type HomeCopy = Dictionary["home"];

type FamilyTreeBoardProps = {
  people: FamilyMemberView[];
  relationships: FamilyRelationshipView[];
  focusPersonId?: string | null;
  labels: HomeCopy["boardLabels"];
  home: HomeCopy;
  isFullscreen?: boolean;
  onAddPerson?: (
    newPerson: FamilyMemberView,
    relationship?: { fromId: string; toId: string; type: string }
  ) => void;
  onAddRelationship?: (fromId: string, toId: string, type: string) => void;
  onUpdatePerson?: (updatedPerson: FamilyMemberView) => void;
  onDeletePerson?: (personId: string) => void;
  onDeleteRelationship?: (relationshipId: string) => void;
  onResetSampleData?: () => void;
};

const nodeTypes: NodeTypes = {
  personNode: PersonNode,
};

function TreeBoardInner({
  people,
  relationships,
  focusPersonId,
  labels,
  home,
  isFullscreen = false,
  onAddPerson,
  onAddRelationship,
  onUpdatePerson,
  onDeletePerson,
  onDeleteRelationship,
  onResetSampleData,
}: FamilyTreeBoardProps) {
  const { setCenter } = useReactFlow();
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTarget, setAddModalTarget] = useState<{
    id: string | null;
    name: string | null;
    type: "child" | "spouse" | "parent" | null;
  }>({ id: null, name: null, type: null });

  const [connectModalData, setConnectModalData] = useState<{
    isOpen: boolean;
    fromId: string;
    toId: string;
    fromName: string;
    toName: string;
  }>({ isOpen: false, fromId: "", toId: "", fromName: "", toName: "" });

  const [inspectorModalData, setInspectorModalData] = useState<{
    isOpen: boolean;
    person: FamilyMemberView | null;
  }>({ isOpen: false, person: null });

  // Handle branch collapse toggling
  const handleToggleExpand = useCallback((personId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  }, []);

  // Handle Quick Add Relative from Node
  const handleAddRelative = useCallback(
    (personId: string, type: "child" | "spouse" | "parent") => {
      const target = people.find((p) => p.id === personId);
      setAddModalTarget({
        id: personId,
        name: target?.name || null,
        type,
      });
      setIsAddModalOpen(true);
    },
    [people]
  );

  // Handle Open Inspector Modal
  const handleOpenInspector = useCallback(
    (personId: string) => {
      const target = people.find((p) => p.id === personId);
      if (target) {
        setInspectorModalData({ isOpen: true, person: target });
      }
    },
    [people]
  );

  // Handle Handle Drag-to-Connect
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target)
        return;

      const fromPerson = people.find((p) => p.id === connection.source);
      const toPerson = people.find((p) => p.id === connection.target);

      if (fromPerson && toPerson) {
        setConnectModalData({
          isOpen: true,
          fromId: fromPerson.id,
          toId: toPerson.id,
          fromName: fromPerson.name,
          toName: toPerson.name,
        });
      }
    },
    [people]
  );

  const { initialNodes, initialEdges } = useMemo(() => {
    const layout = buildFamilyGraphLayout(
      people,
      relationships,
      collapsedNodeIds,
      focusPersonId || people[0]?.id
    );

    const nodesWithHandlers = layout.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onToggleExpand: handleToggleExpand,
        onAddRelative: handleAddRelative,
        onOpenInspector: handleOpenInspector,
      },
    }));

    return { initialNodes: nodesWithHandlers, initialEdges: layout.edges };
  }, [
    people,
    relationships,
    collapsedNodeIds,
    focusPersonId,
    handleToggleExpand,
    handleAddRelative,
    handleOpenInspector,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Search & Jump to Node on Canvas
  const handleSearchSelect = (personId: string) => {
    const targetNode = nodes.find((n) => n.id === personId);
    if (targetNode) {
      setCenter(targetNode.position.x + 110, targetNode.position.y + 60, {
        zoom: 1.2,
        duration: 800,
      });
    }
  };

  const filteredPeople = searchQuery.trim()
    ? people.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSaveNewMember = (data: {
    firstName: string;
    lastName: string;
    relation: string;
    city: string;
    note: string;
    targetPersonId?: string | null;
    relationType?: "child" | "spouse" | "parent" | null;
  }) => {
    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
    const newPerson: FamilyMemberView = {
      id: `node-${Date.now()}`,
      name: fullName,
      role: data.relation.trim() || "Member",
      meta: data.city.trim() || home.defaultMeta,
      tags: [home.defaultTag, data.note.trim() ? home.noteTag : home.addressTag],
    };

    let relObj: { fromId: string; toId: string; type: string } | undefined = undefined;

    if (data.targetPersonId && data.relationType) {
      if (data.relationType === "child") {
        // Target is Parent (top), New Person is Child (bottom)
        relObj = {
          fromId: data.targetPersonId,
          toId: newPerson.id,
          type: "Parent of",
        };
      } else if (data.relationType === "parent") {
        // New Person is Parent (top), Target is Child (bottom)
        relObj = {
          fromId: newPerson.id,
          toId: data.targetPersonId,
          type: "Parent of",
        };
      } else if (data.relationType === "spouse") {
        // Target & New Person are Spouses
        relObj = {
          fromId: data.targetPersonId,
          toId: newPerson.id,
          type: "Spouse of",
        };
      }
    }

    onAddPerson?.(newPerson, relObj);
  };

  const [activeEdgeData, setActiveEdgeData] = useState<{
    isOpen: boolean;
    edgeId: string;
    fromName: string;
    toName: string;
    type: string;
  }>({ isOpen: false, edgeId: "", fromName: "", toName: "", type: "" });

  const handleNodeDrag = useCallback(
    (_event: MouseEvent | TouchEvent, _draggedNode: Node, currentNodes: Node[]) => {
      const typedNodes = currentNodes;
      const parentToChildren = new Map<string, string[]>();
      relationships.forEach((rel) => {
        if (rel.type.toLowerCase().includes("parent")) {
          const children = parentToChildren.get(rel.fromId) || [];
          if (!children.includes(rel.toId)) children.push(rel.toId);
          parentToChildren.set(rel.fromId, children);
        }
      });

      const nodeMap = new Map(typedNodes.map((n) => [n.id, n]));
      const nonSiblingEdges = edges.filter((e) => !e.id.startsWith("inferred-sibling-"));
      const newSiblingEdges: Edge[] = [];

      parentToChildren.forEach((children) => {
        if (children.length > 1) {
          children.sort((aId, bId) => {
            const xA = nodeMap.get(aId)?.position.x ?? 0;
            const xB = nodeMap.get(bId)?.position.x ?? 0;
            return xA - xB;
          });

          for (let i = 0; i < children.length - 1; i++) {
            const c1 = children[i];
            const c2 = children[i + 1];
            newSiblingEdges.push({
              id: `inferred-sibling-${c1}-${c2}`,
              source: c1,
              target: c2,
              sourceHandle: "right",
              targetHandle: "left",
              label: "Sibling of",
              type: "smoothstep",
              style: {
                stroke: "#8b5cf6",
                strokeWidth: 2,
                strokeDasharray: "4,4",
              },
              labelStyle: { fill: "#475569", fontWeight: 600, fontSize: 11 },
              labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9, rx: 6, ry: 6 },
              labelBgPadding: [6, 4],
            });
          }
        }
      });

      // Also ensure all non-inferred sibling edges strictly point from left node to right node
      const normalizedNonSiblingEdges = nonSiblingEdges.map((edge) => {
        const isSiblingEdge = edge.label === "Sibling of";
        if (isSiblingEdge) {
          const xSource = nodeMap.get(edge.source)?.position.x ?? 0;
          const xTarget = nodeMap.get(edge.target)?.position.x ?? 0;
          if (xSource > xTarget) {
            return {
              ...edge,
              source: edge.target,
              target: edge.source,
              sourceHandle: "right",
              targetHandle: "left",
            };
          }
        }
        return edge;
      });

      setEdges([...normalizedNonSiblingEdges, ...newSiblingEdges]);
    },
    [relationships, edges, setEdges]
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: { id: string }) => {
      event.stopPropagation();
      const rel = relationships.find((r) => r.id === edge.id);
      const fromP = people.find((p) => p.id === rel?.fromId);
      const toP = people.find((p) => p.id === rel?.toId);

      if (rel && fromP && toP) {
        setActiveEdgeData({
          isOpen: true,
          edgeId: rel.id,
          fromName: fromP.name,
          toName: toP.name,
          type: rel.type,
        });
      }
    },
    [relationships, people]
  );

  const handleNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, draggedNode: Node) => {
      const targetPerson = people.find((p) => p.id === draggedNode.id);
      if (targetPerson) {
        onUpdatePerson?.({
          ...targetPerson,
          position: {
            x: draggedNode.position.x,
            y: draggedNode.position.y,
          },
        });
      }
    },
    [people, onUpdatePerson]
  );

  if (people.length === 0) {
    return (
      <div className="flex min-h-[480px] w-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-[var(--line)] bg-white/80 p-8 text-center backdrop-blur shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-2xl font-bold text-[var(--accent)]">
          🌱
        </div>
        <h3 className="mt-4 text-2xl font-bold text-[var(--text)]">
          {labels.emptyMessage || "Your Family Tree is Empty"}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
          Start building your family tree by adding the first family member or restore the sample tree.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAddModalTarget({ id: null, name: null, type: null });
              setIsAddModalOpen(true);
            }}
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 active:scale-95"
          >
            + Add First Member
          </button>
          {onResetSampleData && (
            <button
              type="button"
              onClick={onResetSampleData}
              className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-gray-50 active:scale-95"
            >
              Restore Sample Tree
            </button>
          )}
        </div>

        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveNewMember}
          home={home}
          targetPersonName={addModalTarget.name}
          defaultRelationType={addModalTarget.type}
          targetPersonId={addModalTarget.id}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden border-[var(--line)] bg-[linear-gradient(180deg,#fffefb_0%,#f7f1e7_100%)] ${
        isFullscreen
          ? "h-[calc(100vh-100px)] rounded-[2rem] border shadow-md"
          : "h-[540px] rounded-[1.75rem] border shadow-inner md:h-[620px]"
      }`}
    >
      {/* Search Bar Overlay */}
      <div className="absolute left-4 top-4 z-20 w-64 max-w-[calc(100vw-32px)] md:w-72">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-full border border-[var(--line)] bg-white/90 px-4 py-2 text-xs outline-none shadow-sm backdrop-blur focus:border-[var(--accent)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-xs text-gray-400"
            >
              ✕
            </button>
          )}
        </div>

        {filteredPeople.length > 0 && (
          <div className="mt-1 max-h-48 overflow-y-auto rounded-[1rem] border border-[var(--line)] bg-white/95 p-1 shadow-lg backdrop-blur">
            {filteredPeople.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => {
                  handleSearchSelect(person.id);
                  setSearchQuery("");
                }}
                className="w-full rounded-[0.75rem] px-3 py-1.5 text-left text-xs font-semibold hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
              >
                {person.name} ({person.role})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onEdgeClick={handleEdgeClick}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        panOnDrag={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        preventScrolling={false}
        attributionPosition="bottom-right"
        className="touch-none"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#d1d5db"
        />
        <Controls
          className="!bottom-4 !left-4 !m-0 !flex-row !gap-1 !rounded-full !border !border-[var(--line)] !bg-white/90 !p-1.5 !shadow-md backdrop-blur"
          showInteractive={false}
        />
        <MiniMap
          className="!hidden md:!block !bottom-4 !right-4 !m-0 !rounded-[1rem] !border !border-[var(--line)] !bg-white/90 !p-1 !shadow-md"
          zoomable
          pannable
          nodeColor="#059669"
        />
      </ReactFlow>

      {/* Floating Toolbar Controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-wrap gap-2 md:right-4 md:top-4">
        <button
          type="button"
          onClick={() => {
            setAddModalTarget({ id: null, name: null, type: null });
            setIsAddModalOpen(true);
          }}
          className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-95"
        >
          + {labels.addMember}
        </button>
        <button
          type="button"
          onClick={() => setCollapsedNodeIds(new Set())}
          className="rounded-full border border-[var(--line)] bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] shadow-sm backdrop-blur hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:scale-95"
        >
          {labels.expandAll}
        </button>
        <button
          type="button"
          onClick={() => {
            const rootId = focusPersonId || people[0]?.id;
            const allExceptRoot = new Set(
              people.filter((p) => p.id !== rootId).map((p) => p.id)
            );
            setCollapsedNodeIds(allExceptRoot);
          }}
          className="rounded-full border border-[var(--line)] bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] shadow-sm backdrop-blur hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:scale-95"
        >
          {labels.collapseAll}
        </button>
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewMember}
        home={home}
        targetPersonName={addModalTarget.name}
        defaultRelationType={addModalTarget.type}
        targetPersonId={addModalTarget.id}
      />

      <ConnectRelationshipModal
        isOpen={connectModalData.isOpen}
        onClose={() =>
          setConnectModalData((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={(fromId, toId, type) => {
          onAddRelationship?.(fromId, toId, type);
        }}
        fromId={connectModalData.fromId}
        toId={connectModalData.toId}
        fromPersonName={connectModalData.fromName}
        toPersonName={connectModalData.toName}
        home={home}
      />

      <MemberInspectorModal
        isOpen={inspectorModalData.isOpen}
        person={inspectorModalData.person}
        onClose={() =>
          setInspectorModalData({ isOpen: false, person: null })
        }
        onUpdate={(updatedPerson) => onUpdatePerson?.(updatedPerson)}
        onDelete={(personId) => onDeletePerson?.(personId)}
        relationships={relationships}
        people={people}
        onDeleteRelationship={onDeleteRelationship}
        home={home}
      />

      {/* Modern Connection Inspector Modal */}
      {activeEdgeData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">
                  Connection Details
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Relationship between family members
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveEdgeData((prev) => ({ ...prev, isOpen: false }))}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-center">
                <span className="rounded-full bg-[#edf4ee] px-3 py-1 text-xs font-semibold text-[var(--forest)]">
                  {activeEdgeData.type}
                </span>
                <div className="mt-3 flex items-center justify-center gap-2 text-sm font-bold">
                  <span className="text-[var(--accent)]">{activeEdgeData.fromName}</span>
                  <span className="text-gray-400">➔</span>
                  <span className="text-[var(--forest)]">{activeEdgeData.toName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveEdgeData((prev) => ({ ...prev, isOpen: false }))}
                  className="w-1/2 rounded-[1rem] border border-[var(--line)] py-2.5 text-xs font-semibold text-[var(--text)] hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteRelationship?.(activeEdgeData.edgeId);
                    setActiveEdgeData((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="w-1/2 rounded-[1rem] bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
                >
                  Delete Line
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FamilyTreeBoard(props: FamilyTreeBoardProps) {
  return (
    <ReactFlowProvider>
      <TreeBoardInner {...props} />
    </ReactFlowProvider>
  );
}
