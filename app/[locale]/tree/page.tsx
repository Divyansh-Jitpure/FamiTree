import { FamilyTreeCanvasPage } from "@/components/family-tree-canvas-page";
import { type AppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getFamilyWorkspaceData } from "@/lib/family/data";

type TreePageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export default async function TreePage({ params }: TreePageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as AppLocale);
  const workspace = await getFamilyWorkspaceData(dictionary.home);

  return (
    <FamilyTreeCanvasPage
      home={dictionary.home}
      initialPeople={workspace.people}
      initialRelationships={workspace.relationships}
      locale={locale}
      treeId={workspace.treeId}
      source={workspace.source}
    />
  );
}
