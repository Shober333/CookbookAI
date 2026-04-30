export default function RecipeDetailLoading() {
  return (
    <div className="mx-auto max-w-[620px] px-5 py-[26px] md:px-0">
      {/* Title skeleton */}
      <div
        className="mb-2 h-[1.08em] w-[60%] rounded-sm"
        style={{
          fontSize: "32px",
          background: "var(--color-border-soft)",
        }}
      />
      {/* Deck skeleton */}
      <div
        className="mb-1 h-[1.5em] w-[45%] rounded-sm"
        style={{ fontSize: "14px", background: "var(--color-border-soft)" }}
      />
      <div
        className="mb-4 h-[1.5em] w-[30%] rounded-sm"
        style={{ fontSize: "14px", background: "var(--color-border-soft)" }}
      />

      {/* Divider */}
      <div className="my-[14px] border-b-[0.5px] border-border-soft" />

      {/* Controls placeholder */}
      <div
        className="mb-4 h-8 w-[200px] rounded-sm"
        style={{ background: "var(--color-border-soft)" }}
      />

      {/* Divider */}
      <div className="my-[22px] border-b-[0.5px] border-border-soft" />

      {/* Ingredient skeletons */}
      <div
        className="mb-3 h-[1.4em] w-[80px] rounded-sm"
        style={{ fontSize: "10px", background: "var(--color-border-soft)" }}
      />
      <div className="flex flex-col gap-3">
        {[70, 55, 80, 60, 65].map((w, i) => (
          <div
            key={i}
            className="h-[1.65em] rounded-sm"
            style={{
              width: `${w}%`,
              fontSize: "14.5px",
              background: "var(--color-border-soft)",
            }}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="my-[22px] border-b-[0.5px] border-border-soft" />

      {/* Method skeletons */}
      <div
        className="mb-3 h-[1.4em] w-[60px] rounded-sm"
        style={{ fontSize: "10px", background: "var(--color-border-soft)" }}
      />
      <div className="flex flex-col gap-4">
        {[90, 75, 85].map((w, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div
              className="h-[1.65em] rounded-sm"
              style={{
                width: `${w}%`,
                fontSize: "14.5px",
                background: "var(--color-border-soft)",
              }}
            />
            <div
              className="h-[1.65em] rounded-sm"
              style={{
                width: `${Math.max(w - 20, 40)}%`,
                fontSize: "14.5px",
                background: "var(--color-border-soft)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
