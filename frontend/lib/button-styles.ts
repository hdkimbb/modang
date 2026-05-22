/**
 * Disabled filled buttons — background #D1D3D8 (tailwind: gray-disabled / seed-gray-400).
 * Use on native <button> with disabled prop or conditional classes.
 */

/** Orange primary + unified disabled (use with disabled attribute) */
export const BTN_FILLED_PRIMARY =
  "bg-orange-500 text-white disabled:bg-gray-disabled disabled:text-white disabled:cursor-not-allowed disabled:opacity-100";

/** Conditional enabled/disabled (no disabled attribute) */
export const BTN_FILLED_PRIMARY_ENABLED = "bg-orange-500 text-white";
export const BTN_FILLED_PRIMARY_DISABLED =
  "cursor-not-allowed bg-gray-disabled text-white";

/** Dark neutral filled (e.g. 광고센터 non-featured CTA when we add disabled later) */
export const BTN_FILLED_NEUTRAL_ENABLED = "bg-gray-900 text-white";
export const BTN_FILLED_NEUTRAL_DISABLED =
  "cursor-not-allowed bg-gray-disabled text-white";

/** Disabled outline/chip button */
export const BTN_CHIP_DISABLED =
  "cursor-not-allowed rounded-full border border-gray-disabled bg-gray-disabled px-4 py-2 text-sm text-gray-500";

/** Text-only disabled control (e.g. 글쓰기 완료) */
export const BTN_TEXT_DISABLED = "cursor-not-allowed text-gray-500";
