import { MembersDirectoryPage } from "@/components/members-directory-page";
import { type AppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getFamilyWorkspaceData } from "@/lib/family/data";

type MembersPageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export default async function MembersPage({ params }: MembersPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as AppLocale);
  const workspace = await getFamilyWorkspaceData(dictionary.home);

  return (
    <MembersDirectoryPage
      home={dictionary.home}
      initialPeople={workspace.people}
      locale={locale}
    />
  );
}
