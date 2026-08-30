export type LifeEvent = {
  id: string;
  type: "birth" | "death" | "marriage" | "custom";
  date: string;
  label?: string;
  location?: string;
};

export type FamilyMemberView = {
  id: string;
  name: string;
  role: string;
  meta: string;
  tags: string[];
  events?: LifeEvent[];
  position?: { x: number; y: number };
};

export type FamilyRelationshipView = {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  type: string;
};

export type FamilyWorkspaceData = {
  treeId: string | null;
  people: FamilyMemberView[];
  relationships: FamilyRelationshipView[];
  source: "database" | "sample";
};
