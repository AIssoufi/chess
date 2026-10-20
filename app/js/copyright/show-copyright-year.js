import { COPYRIGHT_YEAR_SELECTOR } from './constants.js';

/**
 * Writes the current year at the end of the copyright range of the footer, so that it never goes
 * stale. The page keeps the year written in its HTML when the root or the element is missing, or
 * when the date is not a valid Date.
 *
 * @param {object} [options]
 * @param {ParentNode} [options.root=document] Node that holds the footer.
 * @param {Date} [options.today=new Date()] Date whose year is shown.
 */
export function showCopyrightYear({ root = document, today = new Date() } = {}) {
  const yearNode = root?.querySelector(COPYRIGHT_YEAR_SELECTOR);
  const isValidDate = today instanceof Date && !Number.isNaN(today.getTime());
  if (!yearNode || !isValidDate) return;
  yearNode.textContent = String(today.getFullYear());
}
