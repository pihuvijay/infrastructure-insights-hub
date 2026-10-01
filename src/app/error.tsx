"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">This page didn&apos;t load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again.</p>
        <button onClick={reset} className="btn-primary mt-6">
          Try again
        </button>
      </div>
    </div>
  );
}
