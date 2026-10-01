import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-6xl font-semibold tracking-tight">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">This page doesn&apos;t exist.</p>
        <Link href="/" className="btn-primary mt-6">
          Go home
        </Link>
      </div>
    </div>
  );
}
