export function PlaceEmptyState() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-6 text-center"
      style={{
        paddingTop: "var(--seed-dimension-x16)",
        paddingBottom: "var(--seed-dimension-x16)",
      }}
    >
      <p
        style={{
          fontSize: "var(--seed-font-size-t4)",
          lineHeight: "var(--seed-line-height-t4)",
          color: "var(--seed-color-fg-neutral-subtle)",
          marginBottom: "var(--seed-dimension-x2)",
        }}
      >
        구체적인 단어로 장소를 찾아보세요.
      </p>
      <p
        style={{
          fontSize: "var(--seed-font-size-t4)",
          lineHeight: "var(--seed-line-height-t4)",
          color: "var(--seed-color-fg-neutral-subtle)",
        }}
      >
        예) 당근카페 역삼점
      </p>
    </div>
  );
}
