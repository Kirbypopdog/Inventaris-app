export type Dimensions = {
  widthMm: number | null;
  heightMm: number | null;
  depthMm: number | null;
};

/**
 * The sizes as a carpenter writes them: "B 1200 × H 2400 × D 600 mm". Only the sizes that
 * were measured; plain digits, without thousands separators.
 */
export function formatDimensions({ widthMm, heightMm, depthMm }: Dimensions): string {
  const parts = [
    widthMm === null ? null : `B ${widthMm}`,
    heightMm === null ? null : `H ${heightMm}`,
    depthMm === null ? null : `D ${depthMm}`,
  ].filter((part) => part !== null);
  return parts.length > 0 ? `${parts.join(" × ")} mm` : "";
}
