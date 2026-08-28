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

  if (people.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[1.75rem] border border-[var(--line)] bg-white/70 p-6 text-center text-sm text-[var(--muted)]">
        {labels.emptyMessage}
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
        home={home}
      />
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
