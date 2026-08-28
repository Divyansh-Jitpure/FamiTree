"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/config";
import type { FamilyMemberView } from "@/lib/family/types";

type HomeCopy = Dictionary["home"];

type MemberInspectorModalProps = {
  isOpen: boolean;
  person: FamilyMemberView | null;
  onClose: () => void;
  onUpdate: (updatedPerson: FamilyMemberView) => void;
  onDelete: (personId: string) => void;
  home: HomeCopy;
};

export function MemberInspectorModal({
  isOpen,
  person,
  onClose,
  onUpdate,
  onDelete,
  home,
}: MemberInspectorModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [meta, setMeta] = useState("");

  useEffect(() => {
    if (person) {
      setName(person.name || "");
      setRole(person.role || "");
      setMeta(person.meta || "");
    }
  }, [person]);

  if (!isOpen || !person) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...person,
      name,
      role,
      meta,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${person.name} from the tree?`)) {
      onDelete(person.id);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity"
      />

      {/* Right Sidebar Drawer */}
      <div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-lg font-bold text-[var(--accent)]">
              {person.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">{person.name}</h2>
              <p className="text-xs text-[var(--muted)]">{person.meta || "Member Profile"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-strong)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
              Member Overview
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#edf4ee] px-3 py-1 text-xs font-semibold text-[var(--forest)]">
                {person.role}
              </span>
              {person.meta ? (
                <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-medium text-[var(--muted)]">
                  📍 {person.meta}
                </span>
              ) : null}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)]">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-[1rem] border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)]">
                Primary Relation / Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1.5 w-full rounded-[1rem] border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)]">
                Location / Metadata
              </label>
              <input
                type="text"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                placeholder="e.g. City, Country"
                className="mt-1.5 w-full rounded-[1rem] border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="pt-4 flex items-center justify-between gap-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-100"
              >
                Delete Member
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-[1rem] border border-[var(--line)] px-4 py-3 text-xs font-semibold text-[var(--text)] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[1rem] bg-[var(--accent)] px-5 py-3 text-xs font-bold text-white shadow-sm hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
