'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center bg-background px-6 pt-28 pb-16">
      <div className="max-w-lg w-full text-center">
        <h1 className="font-display text-5xl leading-none text-foreground">Something went wrong.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This part of the app hit an error. The rest of the app is still running.
        </p>
        {process.env.NODE_ENV === 'development' ? (
          <pre className="mt-4 overflow-x-auto rounded bg-muted p-3 text-left text-xs text-foreground">
            {error.message || String(error)}
          </pre>
        ) : null}
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
