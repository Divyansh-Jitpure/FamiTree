"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/config";

type HomeCopy = Dictionary["home"];

type ConnectRelationshipModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fromId: string, toId: string, type: string) => void;
  fromPersonName: string;
  toPersonName: string;
  fromId: string;
  toId: string;
  home: HomeCopy;
};

export function ConnectRelationshipModal({
  isOpen,
  onClose,
  onConfirm,
  fromPersonName,
  toPersonName,
  fromId,
  toId,
  home,
}: ConnectRelationshipModalProps) {
  const [type, setType] = useState(home.relationshipOptions[0] || "Parent of");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(fromId, toId, type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div>
            <h3 className="text-lg font-bold text-[var(--text)]">
              {home.boardLabels.connectModalTitle}
            </h3>
            <p className="text-xs text-[var(--muted)]">
              {home.boardLabels.connectModalDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-[1rem] border border-[var(--line)] bg-gray-50/80 p-3 text-center text-xs font-semibold text-[var(--text)]">
            <span className="font-bold text-[var(--accent)]">{fromPersonName}</span>
            <span className="mx-2 text-gray-400">➔</span>
            <span className="font-bold text-[var(--forest)]">{toPersonName}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)]">
              {home.relationshipFields.type}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            >
              {home.relationshipOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 rounded-[1rem] border border-[var(--line)] py-2.5 text-sm font-semibold text-[var(--text)] hover:bg-gray-50"
            >
              {home.boardLabels.cancel}
            </button>
            <button
              type="submit"
              className="w-1/2 rounded-[1rem] bg-[var(--forest)] py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {home.relationshipSubmitAction}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
