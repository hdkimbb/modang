export function PlaceEmptyState() {
  return (
    <p
      className="px-4 py-8 text-center"
      style={{
        fontSize: "var(--seed-font-size-t4)",
        lineHeight: "var(--seed-line-height-t4)",
        color: "var(--seed-color-fg-neutral-subtle)",
      }}
    >
      검색 결과가 없어요.
    </p>
  );
}
