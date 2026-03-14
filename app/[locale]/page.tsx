import { FamilyWorkspace } from "@/components/family-workspace";
import { type AppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getFamilyWorkspaceData } from "@/lib/family/data";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as AppLocale);
  const workspace = await getFamilyWorkspaceData(dictionary.home);

  return (
    <FamilyWorkspace
      home={dictionary.home}
      initialPeople={workspace.people}
      initialRelationships={workspace.relationships}
      locale={locale}
      treeId={workspace.treeId}
      source={workspace.source}
    />
  );
}
