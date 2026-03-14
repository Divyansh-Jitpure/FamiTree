import { FamilyWorkspace } from "@/components/family-workspace";
import { type AppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale as AppLocale);

  return <FamilyWorkspace home={dictionary.home} locale={locale} />;
}
