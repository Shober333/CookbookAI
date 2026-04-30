import Link from "next/link";

export default function RecipeNotFound() {
  return (
    <div
      className="mx-auto max-w-[620px] px-5 py-[64px] md:px-0"
      role="alert"
    >
      <p className="font-ui text-eyebrow uppercase tracking-[0.16em] text-accent">
        Not here
      </p>
      <h1 className="mt-1 font-display text-display-md font-medium text-ink">
        We can't find that recipe.
      </h1>
      <p className="mt-2 font-display text-deck italic text-ink-muted">
        It might have been deleted, or the link might be old.
      </p>
      <div className="mt-6">
        <Link
          href="/library"
          className="font-ui text-ui text-ink underline-offset-2 hover:underline"
        >
          ← Back to library
        </Link>
      </div>
    </div>
  );
}
