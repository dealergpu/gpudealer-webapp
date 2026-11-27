import { Link } from '@/i18n/navigation';
import { getI18n } from '@/i18n/server';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div
      data-nav="dark"
      className="dark relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-background px-4 pt-28 pb-20 text-center text-foreground"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(357_90%_50%/0.22),transparent)] blur-2xl" />
      <p className="relative font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t.notFound.eyebrow}</p>
      <h1 className="relative mt-4 font-display text-6xl leading-none md:text-8xl">
        {t.notFound.titleStart} <em className="text-accent">{t.notFound.titleEm}</em>
      </h1>
      <p className="relative mt-5 max-w-md text-muted-foreground">
        {t.notFound.body}
      </p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">{t.notFound.home}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/gpus">{t.notFound.browse}</Link>
        </Button>
      </div>
    </div>
  );
}
