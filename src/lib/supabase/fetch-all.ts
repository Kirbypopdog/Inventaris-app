/** The API returns at most this many rows per request (supabase/config.toml, max_rows). */
const PAGE_SIZE = 1000;

/**
 * Fetches every row, page by page, so a list is never cut off at the API limit.
 * `page` must order by a unique column, so rows never move between pages.
 */
export async function fetchAll<Row>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }>,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`Loading rows failed: ${error.message}`);
    }
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) {
      return rows;
    }
  }
}
