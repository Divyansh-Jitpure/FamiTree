"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { PersonNodeData } from "@/lib/family/family-graph-layout";

export const PersonNode = memo(function PersonNode({
  data,
}: NodeProps<Node<PersonNodeData>>) {
  const initial = data.name ? data.name.trim().slice(0, 1).toUpperCase() : "?";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        data.onOpenInspector?.(data.id);
      }}
      className={`group relative min-w-[220px] max-w-[260px] cursor-pointer rounded-[1.25rem] border bg-white/95 p-4 shadow-sm backdrop-blur transition-all hover:shadow-md ${
        data.isFocus
          ? "border-2 border-[var(--accent)] ring-4 ring-[var(--accent-soft)]"
          : "border-[var(--line)]"
      }`}
    >
      {/* Top Handle (Parent Connection & Add Parent Button) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!h-3 !w-3 !border-2 !border-white !bg-blue-600 hover:!scale-125 transition-transform"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          data.onAddRelative?.(data.id, "parent");
        }}
        className="absolute -top-3.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-blue-300 bg-blue-600 text-[10px] font-bold text-white shadow-sm transition-transform hover:scale-110 active:scale-95"
        title="Add Parent (Above)"
      >
        +
      </button>

      {/* Right Handle (Spouse Connection & Add Spouse Button) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!h-3 !w-3 !border-2 !border-white !bg-rose-500 hover:!scale-125 transition-transform"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          data.onAddRelative?.(data.id, "spouse");
        }}
        className="absolute -right-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-rose-300 bg-rose-500 text-[10px] font-bold text-white shadow-sm transition-transform hover:scale-110 active:scale-95"
        title="Add Spouse (Beside)"
      >
        +
      </button>

      {/* Left Handle (Spouse Target) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!h-3 !w-3 !border-2 !border-white !bg-rose-500 hover:!scale-125 transition-transform"
      />

      {/* Card Content */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            data.isFocus
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--accent-soft)] text-[var(--accent)]"
          }`}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--text)]" title={data.name}>
            {data.name}
          </p>
          {data.meta ? (
            <p className="truncate text-xs text-[var(--muted)]" title={data.meta}>
              {data.meta}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--line)]/60">
        <span className="rounded-full bg-[#edf4ee] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--forest)]">
          {data.role}
        </span>
      </div>

      {/* Bottom Handles (Child Connection, Sibling Target & Add Child Button) */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!h-3 !w-3 !border-2 !border-white !bg-[var(--forest)] hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!h-3 !w-3 !border-2 !border-white !bg-[var(--forest)] hover:!scale-125 transition-transform"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          data.onAddRelative?.(data.id, "child");
        }}
        className="absolute -bottom-3.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-emerald-300 bg-[var(--forest)] text-[10px] font-bold text-white shadow-sm transition-transform hover:scale-110 active:scale-95"
        title="Add Child (Below)"
      >
        +
      </button>
    </div>
  );
});
