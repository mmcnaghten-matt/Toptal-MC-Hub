// Page-break planning for the Client Insights PDF export.
//
// Each report section is captured as one tall image. A section taller than a PDF page is cut into page-sized slices.
// Cuts are chosen by looking at the captured image itself: a cut is placed in a band of blank rows (the gap between two
// cards or paragraphs) near the bottom of the page, so text and cards are not sliced in half. Working from the image
// (not from the live page layout) means the cuts always match what was actually rendered, even if the renderer wraps
// text slightly differently from the browser. If no blank band exists, the page is cut at its limit.
//
// All positions in this file are image pixels from the top of the image.

const BLANK = 250; // a pixel counts as background when R, G and B are all at least this
const MIN_GAP = 6; // a blank band must be at least this many image pixels tall

/** Finds the best cut position in [min, limit] (a blank band), or null if there is none. */
export function findBlankCut(img: HTMLImageElement, min: number, limit: number): number | null {
  const h = Math.floor(limit - min);
  if (h < MIN_GAP) return null;
  const margin = Math.round(img.width * 0.012); // ignore the section's own border/shadow at both edges
  const innerW = img.width - margin * 2;
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, Math.floor(min), img.width, h, 0, 0, img.width, h);

  const blankRows: boolean[] = new Array(h).fill(false);
  const CHUNK = 256;
  for (let y0 = 0; y0 < h; y0 += CHUNK) {
    const ch = Math.min(CHUNK, h - y0);
    const data = ctx.getImageData(margin, y0, innerW, ch).data;
    for (let r = 0; r < ch; r++) {
      let blank = true;
      const rowStart = r * innerW * 4;
      for (let x = 0; x < innerW; x += 2) {
        const i = rowStart + x * 4;
        if (data[i] < BLANK || data[i + 1] < BLANK || data[i + 2] < BLANK) {
          blank = false;
          break;
        }
      }
      blankRows[y0 + r] = blank;
    }
  }

  // Runs of blank rows
  const runs: { start: number; len: number }[] = [];
  for (let y = 0; y < h; ) {
    if (!blankRows[y]) {
      y++;
      continue;
    }
    let e = y;
    while (e < h && blankRows[e]) e++;
    if (e - y >= MIN_GAP) runs.push({ start: y, len: e - y });
    y = e;
  }
  if (!runs.length) return null;
  // Prefer a big gap (between blocks) over small ones (between lines); among similar gaps take the lowest one.
  const maxLen = Math.max(...runs.map((r) => r.len));
  const pick = [...runs].reverse().find((r) => r.len >= maxLen * 0.7)!;
  return Math.floor(min) + pick.start + Math.floor(pick.len / 2);
}

/**
 * Returns the y positions where each page starts (first is always 0). `firstPx` is the room on the first page,
 * `nextPx` the room on each following page (both in image pixels).
 */
export function planCutsFromImage(img: HTMLImageElement, firstPx: number, nextPx: number): number[] {
  const cuts: number[] = [0];
  let room = firstPx;
  while (img.height - cuts[cuts.length - 1] > room) {
    const start = cuts[cuts.length - 1];
    const limit = Math.floor(start + room);
    const min = Math.floor(start + room * 0.4); // avoid nearly empty pages
    cuts.push(findBlankCut(img, min, limit) ?? limit);
    room = nextPx;
  }
  return cuts;
}

/** Crops [startPx, endPx) out of a captured image and returns it as a PNG data URL. */
export function sliceImageToDataUrl(img: HTMLImageElement, startPx: number, endPx: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = Math.max(1, Math.round(endPx - startPx));
  canvas.getContext("2d")!.drawImage(img, 0, Math.round(startPx), img.width, canvas.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}
