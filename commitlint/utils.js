import {
  BOT_SIGN_OFF,
  RELEASE_COMMIT_HEADER,
  TICKET_REFERENCE_ERROR,
  TICKET_REFERENCE_LINE,
} from './constants.js';

/**
 * Tells whether a commit names its ticket in a `Refs: CHESS-<n>` line after its header: in the
 * trailer block, or in an earlier paragraph, as some older commits do.
 *
 * @param {object} [parsed] The commit, as commitlint parses it.
 * @param {string | null} [parsed.body] The paragraphs after the header, up to the footer.
 * @param {string | null} [parsed.footer] The paragraphs from the first note or issue reference.
 * @returns {boolean} `true` when a line of the body or the footer names a ticket.
 * @example
 * hasTicketReference({ body: 'Refs: CHESS-12' }); // true
 * hasTicketReference({ body: 'See CHESS-12.' }); // false
 */
export function hasTicketReference(parsed) {
  const { body, footer } = parsed ?? {};
  const text = [body, footer].filter((part) => typeof part === 'string').join('\n');
  return TICKET_REFERENCE_LINE.test(text);
}

/**
 * commitlint rule that requires a ticket reference, see `hasTicketReference`. It is meant to be
 * used with `'always'`.
 *
 * @param {object} [parsed] The commit, as commitlint parses it.
 * @returns {[boolean, string]} Whether the commit passes, and the error shown when it does not.
 */
export function ticketReference(parsed) {
  return [hasTicketReference(parsed), TICKET_REFERENCE_ERROR];
}

/**
 * Tells whether a bot wrote the commit: a release of release-please, or a commit signed off by a
 * GitHub App such as Dependabot. Bots do not follow the conventions of this repository, so
 * commitlint ignores their commits.
 *
 * @param {string} message The whole commit message.
 * @returns {boolean} `true` for a commit of a bot, `false` otherwise or without a message.
 * @example
 * isBotCommit('chore(master): release 2.1.0'); // true
 * isBotCommit('fix: x\n\nSigned-off-by: dependabot[bot] <support@github.com>'); // true
 */
export function isBotCommit(message) {
  if (typeof message !== 'string') return false;

  const [header] = message.split(/\r?\n/);
  const isRelease = RELEASE_COMMIT_HEADER.test(header);
  const isSignedOffByBot = BOT_SIGN_OFF.test(message);
  return isRelease || isSignedOffByBot;
}
