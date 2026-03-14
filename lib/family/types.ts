export type FamilyMemberView = {
  id: string;
  name: string;
  role: string;
  meta: string;
  tags: string[];
};

export type FamilyWorkspaceData = {
  treeId: string | null;
  people: FamilyMemberView[];
  source: "database" | "sample";
};
