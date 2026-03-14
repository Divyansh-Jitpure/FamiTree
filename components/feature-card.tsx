type Feature = {
  title: string;
  description: string;
};

type FeatureCardProps = {
  feature: Feature;
};

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <article className="glass rounded-[1.5rem] px-5 py-5">
      <h2 className="text-lg font-bold">{feature.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{feature.description}</p>
    </article>
  );
}
