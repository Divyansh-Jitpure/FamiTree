"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/config";
import type { FamilyMemberView, FamilyRelationshipView, LifeEvent } from "@/lib/family/types";

type HomeCopy = Dictionary["home"];

type MemberInspectorModalProps = {
  isOpen: boolean;
  person: FamilyMemberView | null;
  onClose: () => void;
  onUpdate: (updatedPerson: FamilyMemberView) => void;
  onDelete: (personId: string) => void;
  relationships?: FamilyRelationshipView[];
  people?: FamilyMemberView[];
  onDeleteRelationship?: (relationshipId: string) => void;
  home: HomeCopy;
};

export function MemberInspectorModal({
  isOpen,
  person,
  onClose,
  onUpdate,
  onDelete,
  relationships = [],
  people = [],
  onDeleteRelationship,
  home,
}: MemberInspectorModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [meta, setMeta] = useState("");
  const [events, setEvents] = useState<LifeEvent[]>([]);

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventData, setNewEventData] = useState<{
    type: "birth" | "death" | "marriage" | "custom";
    date: string;
    label: string;
    location: string;
  }>({ type: "birth", date: "", label: "", location: "" });

  useEffect(() => {
    if (person) {
      setName(person.name || "");
      setRole(person.role || "");
      const defaultMetaStr = home?.defaultMeta || "Location not added yet";
      const isDefault =
        !person.meta ||
        person.meta === defaultMetaStr ||
        person.meta === "Location not added yet";
      setMeta(isDefault ? "" : person.meta);
      setEvents(person.events || []);
      setIsAddingEvent(false);
    }
  }, [person, home?.defaultMeta]);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen || !person) return null;

  const explicitRelationships = relationships.filter(
    (r) => r.fromId === person.id || r.toId === person.id
  );

  // Infer co-parent connections via spouse (Bi-directional)
  const inferredCoParents: FamilyRelationshipView[] = [];

  // Direction A: Inspecting a Child -> Infer parents (spouses of their explicit parent)
  relationships.forEach((rel) => {
    if (rel.type.toLowerCase().includes("parent") && rel.toId === person.id) {
      const parentId = rel.fromId;
      const parentSpouses = relationships.filter((r) => {
        const t = r.type.toLowerCase();
        const isSpouse =
          t.includes("spouse") ||
          t.includes("patni") ||
          t.includes("pati") ||
          t.includes("wife") ||
          t.includes("husband");
        return isSpouse && (r.fromId === parentId || r.toId === parentId);
      });

      parentSpouses.forEach((sp) => {
        const spouseId = sp.fromId === parentId ? sp.toId : sp.fromId;
        const alreadyExplicit = explicitRelationships.some(
          (r) => (r.fromId === spouseId && r.toId === person.id) || (r.fromId === person.id && r.toId === spouseId)
        );
        const alreadyInferred = inferredCoParents.some(
          (r) => r.fromId === spouseId && r.toId === person.id
        );
        if (!alreadyExplicit && !alreadyInferred) {
          const spousePerson = people.find((p) => p.id === spouseId);
          inferredCoParents.push({
            id: `inferred-coparent-${spouseId}-${person.id}`,
            fromId: spouseId,
            toId: person.id,
            fromName: spousePerson?.name || "Co-Parent",
            toName: person.name,
            type: "Parent of",
          });
        }
      });
    }
  });

  // Direction B: Inspecting a Spouse -> Infer children (children of their spouse)
  const spousesOfPerson = relationships.filter((r) => {
    const t = r.type.toLowerCase();
    const isSpouse =
      t.includes("spouse") ||
      t.includes("patni") ||
      t.includes("pati") ||
      t.includes("wife") ||
      t.includes("husband");
    return isSpouse && (r.fromId === person.id || r.toId === person.id);
  });

  spousesOfPerson.forEach((sp) => {
    const spouseId = sp.fromId === person.id ? sp.toId : sp.fromId;
    const spouseChildrenRels = relationships.filter(
      (r) => r.fromId === spouseId && r.type.toLowerCase().includes("parent")
    );

    spouseChildrenRels.forEach((childRel) => {
      const childId = childRel.toId;
      const alreadyExplicit = explicitRelationships.some(
        (r) => (r.fromId === person.id && r.toId === childId) || (r.fromId === childId && r.toId === person.id)
      );
      const alreadyInferred = inferredCoParents.some(
        (r) => r.fromId === person.id && r.toId === childId
      );

      if (!alreadyExplicit && !alreadyInferred) {
        const childPerson = people.find((p) => p.id === childId);
        inferredCoParents.push({
          id: `inferred-coparent-${person.id}-${childId}`,
          fromId: person.id,
          toId: childId,
          fromName: person.name,
          toName: childPerson?.name || "Child",
          type: "Parent of",
        });
      }
    });
  });

  const personRelationships = [...explicitRelationships, ...inferredCoParents];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...person,
      name,
      role,
      meta,
      events,
    });
    onClose();
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventData.date) return;

    const defaultLabels: Record<string, string> = {
      birth: "Birth",
      death: "Death",
      marriage: "Marriage",
      custom: "Event",
    };

    const newEv: LifeEvent = {
      id: `event-${Date.now()}`,
      type: newEventData.type,
      date: newEventData.date,
      label: newEventData.label.trim() || defaultLabels[newEventData.type] || "Event",
      location: newEventData.location.trim() || undefined,
    };

    const updatedEvents = [...events, newEv].sort((a, b) => a.date.localeCompare(b.date));
    setEvents(updatedEvents);
    setNewEventData({ type: "birth", date: "", label: "", location: "" });
    setIsAddingEvent(false);

    // Auto save on event add
    onUpdate({
      ...person,
      name,
      role,
      meta,
      events: updatedEvents,
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    const updatedEvents = events.filter((e) => e.id !== eventId);
    setEvents(updatedEvents);
    onUpdate({
      ...person,
      name,
      role,
      meta,
      events: updatedEvents,
    });
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
              <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-medium text-[var(--muted)]">
                📍 {person.meta || home?.defaultMeta || "Location not added yet"}
              </span>
            </div>
          </div>

          {/* Active Connections Section */}
          <div className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                Active Connections ({personRelationships.length})
              </p>
            </div>
            <div className="mt-3 space-y-2">
              {personRelationships.map((rel) => {
                const otherId = rel.fromId === person.id ? rel.toId : rel.fromId;
                const otherPerson = people.find((p) => p.id === otherId);
                const isFrom = rel.fromId === person.id;
                const isInferred = rel.id.startsWith("inferred-coparent-");
                const relLabel = isInferred
                  ? isFrom
                    ? "Parent of (via Spouse)"
                    : "Parent (via Spouse)"
                  : isFrom
                  ? rel.type
                  : `Related to (${rel.type})`;

                return (
                  <div
                    key={rel.id}
                    className={`flex items-center justify-between rounded-[0.75rem] border px-3 py-2 text-xs ${
                      isInferred
                        ? "border-dashed border-amber-300 bg-amber-50/60"
                        : "border-[var(--line)] bg-gray-50/80"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-semibold text-gray-700">{relLabel}</span>{" "}
                      <span className="font-bold text-[var(--accent)]">
                        {otherPerson?.name || rel.toName || rel.fromName || "Relative"}
                      </span>
                    </div>
                    {isInferred ? (
                      <span className="shrink-0 rounded bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-600">
                        Auto
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDeleteRelationship?.(rel.id)}
                        className="shrink-0 rounded bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100"
                        title="Remove Connection"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                );
              })}
              {personRelationships.length === 0 && (
                <p className="text-xs text-[var(--muted)]">No active relationship links.</p>
              )}
            </div>
          </div>

          {/* Life Events Section */}
          <div className="rounded-[1.25rem] border border-[var(--line)] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                Life Events ({events.length})
              </p>
              {!isAddingEvent && (
                <button
                  type="button"
                  onClick={() => setIsAddingEvent(true)}
                  className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  + Add Event
                </button>
              )}
            </div>

            {/* Inline Add Event Form */}
            {isAddingEvent && (
              <form onSubmit={handleAddEvent} className="mt-3 space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700">Event Type</label>
                  <select
                    value={newEventData.type}
                    onChange={(e) =>
                      setNewEventData((prev) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 outline-none focus:border-amber-500"
                  >
                    <option value="birth">🎂 Birth</option>
                    <option value="death">✝ Death</option>
                    <option value="marriage">💍 Marriage</option>
                    <option value="custom">⭐ Custom Event</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-gray-700">Date *</label>
                    <input
                      type="date"
                      required
                      value={newEventData.date}
                      onChange={(e) =>
                        setNewEventData((prev) => ({ ...prev, date: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700">Label (Optional)</label>
                    <input
                      type="text"
                      placeholder={
                        newEventData.type === "birth"
                          ? "Birth"
                          : newEventData.type === "death"
                          ? "Death"
                          : newEventData.type === "marriage"
                          ? "Marriage"
                          : "Graduation, etc."
                      }
                      value={newEventData.label}
                      onChange={(e) =>
                        setNewEventData((prev) => ({ ...prev, label: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Location (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. City, Hospital, Church"
                    value={newEventData.location}
                    onChange={(e) =>
                      setNewEventData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingEvent(false)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1 font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-amber-600 px-3 py-1 font-bold text-white shadow-xs hover:bg-amber-700"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            )}

            {/* Events Timeline */}
            <div className="mt-3 space-y-2">
              {events.map((ev) => {
                const icon =
                  ev.type === "birth"
                    ? "🎂"
                    : ev.type === "death"
                    ? "✝"
                    : ev.type === "marriage"
                    ? "💍"
                    : "⭐";

                return (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-gray-50/80 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="text-base">{icon}</span>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{ev.label || ev.type}</span>
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            {ev.date}
                          </span>
                        </div>
                        {ev.location && (
                          <p className="truncate text-[11px] text-[var(--muted)]">
                            📍 {ev.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="shrink-0 rounded bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100"
                      title="Delete Event"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {events.length === 0 && !isAddingEvent && (
                <p className="text-xs text-[var(--muted)]">No life events recorded yet.</p>
              )}
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
                placeholder={home?.defaultMeta || "Location not added yet"}
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
