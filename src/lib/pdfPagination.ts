// Page-break planning for the Client Insights PDF export.
//
// Each report section is captured as one tall image. A section taller than a PDF page is cut into page-sized slices
// instead of being squeezed or clipped. Cuts are placed between "atomic" elements (paragraphs, list items, table rows,
// small cards, pills) so text and cards are not sliced in half; if a block is taller than a page it is cut anyway.

export interface Interval {
  top: number;
  bottom: number;
}

const ATOMIC_SELECTOR = "p, li, tr, h3, h4, h5, svg, img, span.rounded-full";

/** Positions are CSS px relative to the top of `root`. Cards (.rounded-lg) stay whole only if they fit in `maxCardPx`. */
export function collectAtomicIntervals(root: HTMLElement, maxCardPx: number): Interval[] {
  const rootTop = root.getBoundingClientRect().top;
  const out: Interval[] = [];
  root.querySelectorAll<HTMLElement>(`${ATOMIC_SELECTOR}, .rounded-lg`).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.height === 0) return;
    if (el.classList.contains("rounded-lg") && r.height > maxCardPx) return;
    out.push({ top: r.top - rootTop, bottom: r.bottom - rootTop });
  });
  return out;
}

/**
 * Returns the y positions where each page starts (first is always 0). `firstPx` is the room on the first page,
 * `nextPx` the room on each following page.
 */
export function planPageCuts(totalPx: number, firstPx: number, nextPx: number, atomics: Interval[]): number[] {
  const cuts: number[] = [0];
  const clean = (y: number) => !atomics.some((a) => a.top + 1 < y && y < a.bottom - 1);
  const candidates = [...new Set(atomics.flatMap((a) => [Math.round(a.top), Math.round(a.bottom)]))].sort((a, b) => b - a);
  let room = firstPx;
  while (totalPx - cuts[cuts.length - 1] > room) {
    const start = cuts[cuts.length - 1];
    const limit = start + room;
    const min = start + room * 0.4; // avoid nearly empty pages
    cuts.push(candidates.find((c) => c <= limit && c >= min && clean(c)) ?? limit);
    room = nextPx;
  }
  return cuts;
}

/** Crops [startCss, endCss) (CSS px from the top) out of a captured image and returns it as a PNG data URL. */
export function sliceImageToDataUrl(img: HTMLImageElement, startCss: number, endCss: number, pixelRatio: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = Math.max(1, Math.round((endCss - startCss) * pixelRatio));
  canvas.getContext("2d")!.drawImage(img, 0, Math.round(startCss * pixelRatio), img.width, canvas.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}
