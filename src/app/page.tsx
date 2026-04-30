export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">
        CookbookAI
      </p>
      <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold leading-tight text-foreground sm:text-5xl">
        Import recipes from the web and adapt them to your kitchen.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
        Sprint 01 scaffold is ready for auth, recipe import, and library
        features.
      </p>
    </main>
  );
}
