import { ImportForm } from "@/components/import/ImportForm";

export default function ImportPage() {
  return (
    <div className="flex flex-col items-center px-5 pt-8 md:px-7 md:pt-16">
      <div className="w-full max-w-[480px]">
        <p className="mb-1 text-eyebrow uppercase tracking-[0.16em] text-accent">
          Add a new one
        </p>
        <h1 className="mb-1 font-display text-display-md font-medium text-ink">
          Bring a recipe home.
        </h1>
        <p className="mb-[22px] font-display text-deck italic text-ink-muted">
          Paste a link and we'll read the recipe for you.
        </p>
        <ImportForm />
      </div>
    </div>
  );
}
