/** Severities of a commitlint rule, numbered as `RuleConfigSeverity` of `@commitlint/types`. */
export const RULE_SEVERITY = Object.freeze({
  disabled: 0,
  warning: 1,
  error: 2,
});

/** Name of the commitlint rule that requires a ticket reference. */
export const TICKET_REFERENCE_RULE = 'ticket-reference';

/**
 * A `Refs:` line naming at least one ticket of this repository, such as `Refs: CHESS-12` or
 * `Refs: CHESS-3, CHESS-4`. The `CHESS-` autolink of GitHub makes each reference a link.
 */
export const TICKET_REFERENCE_LINE = /^Refs:.*\bCHESS-[1-9]\d*\b/m;

/** Error shown when a commit names no ticket. */
export const TICKET_REFERENCE_ERROR =
  'name the ticket of the commit in a "Refs: CHESS-<n>" trailer, such as "Refs: CHESS-12"';

/**
 * Header of a release commit of release-please, such as `chore(master): release 2.1.0` or, with a
 * component, `chore(master): release chess 2.1.0`.
 */
export const RELEASE_COMMIT_HEADER = /^chore(\([^)]+\))?: release( \S+)? v?\d+\.\d+\.\d+\S*$/;

/** Sign-off of a GitHub App, such as `Signed-off-by: dependabot[bot] <support@github.com>`. */
export const BOT_SIGN_OFF = /^Signed-off-by: \S+\[bot\] /m;

/** Section of the README that explains the commit conventions, linked from commitlint errors. */
export const COMMIT_CONVENTIONS_URL = 'https://github.com/AIssoufi/chess#conventions';
