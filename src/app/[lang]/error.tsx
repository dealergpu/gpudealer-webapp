'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error('Route error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center bg-background px-6 pt-28 pb-16">
      <div className="max-w-lg w-full text-center">
        <h1 className="font-display text-5xl leading-none text-foreground">{t.error.title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {t.error.body}
        </p>
        {process.env.NODE_ENV === 'development' ? (
          <pre className="mt-4 overflow-x-auto rounded bg-muted p-3 text-left text-xs text-foreground">
            {error.message || String(error)}
          </pre>
        ) : null}
        <Button className="mt-6" onClick={reset}>
          {t.common.tryAgain}
        </Button>
      </div>
    </div>
  );
}
