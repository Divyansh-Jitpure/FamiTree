"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/config";

type HomeCopy = Dictionary["home"];

type AddMemberModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    firstName: string;
    lastName: string;
    relation: string;
    city: string;
    note: string;
    targetPersonId?: string | null;
    relationType?: "child" | "spouse" | "parent" | null;
  }) => void;
  home: HomeCopy;
  targetPersonName?: string | null;
  defaultRelationType?: "child" | "spouse" | "parent" | null;
  targetPersonId?: string | null;
};

export function AddMemberModal({
  isOpen,
  onClose,
  onSave,
  home,
  targetPersonName,
  defaultRelationType,
  targetPersonId,
}: AddMemberModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState(home.placeholders.lastName);
  const [relation, setRelation] = useState("Relative");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (defaultRelationType === "child") setRelation("Child");
    else if (defaultRelationType === "spouse") setRelation("Spouse");
    else if (defaultRelationType === "parent") setRelation("Parent");
    else setRelation(home.relationOptions[0] || "Relative");
  }, [defaultRelationType, home.relationOptions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;

    onSave({
      firstName,
      lastName,
      relation,
      city,
      note,
      targetPersonId,
      relationType: defaultRelationType,
    });
    setFirstName("");
    setCity("");
    setNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div>
            <h3 className="text-xl font-bold text-[var(--text)]">
              {targetPersonName
                ? `Add ${defaultRelationType || "Relative"} for ${targetPersonName}`
                : home.formTitle}
            </h3>
            <p className="text-xs text-[var(--muted)]">{home.formDescription}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[var(--text)]">
              {home.fields.firstName} *
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={home.placeholders.firstName}
              className="mt-1 w-full rounded-[1rem] border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)]">
              {home.fields.lastName}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={home.placeholders.lastName}
              className="mt-1 w-full rounded-[1rem] border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)]">
              {home.fields.relation}
            </label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="mt-1 w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            >
              {home.relationOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)]">
              {home.fields.city}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={home.placeholders.city}
              className="mt-1 w-full rounded-[1rem] border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)]">
              {home.fields.note}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={home.placeholders.note}
              className="mt-1 w-full rounded-[1rem] border border-[var(--line)] px-4 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
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
              className="w-1/2 rounded-[1rem] bg-[var(--accent)] py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              {home.submitAction}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
