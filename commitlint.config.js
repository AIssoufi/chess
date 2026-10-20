import {
  COMMIT_CONVENTIONS_URL,
  RULE_SEVERITY,
  TICKET_REFERENCE_RULE,
} from './commitlint/constants.js';
import { isBotCommit, ticketReference } from './commitlint/utils.js';

/**
 * Commit messages follow Conventional Commits and name their ticket in a `Refs: CHESS-<n>`
 * trailer. commitlint already ignores merge, revert and fixup commits by default; the commits of
 * bots, such as Dependabot and release-please, are ignored too.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [{ rules: { [TICKET_REFERENCE_RULE]: ticketReference } }],
  rules: {
    [TICKET_REFERENCE_RULE]: [RULE_SEVERITY.error, 'always'],
  },
  ignores: [isBotCommit],
  helpUrl: COMMIT_CONVENTIONS_URL,
};
