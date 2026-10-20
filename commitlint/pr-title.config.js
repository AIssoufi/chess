import config from '../commitlint.config.js';
import { RULE_SEVERITY, TICKET_REFERENCE_RULE } from './constants.js';

/**
 * Pull request titles follow the rules of commit headers, but need no ticket reference: a title
 * is a header alone, and the merge commit names the branch, which is the ticket. They keep the
 * ignores of commits too, so the `Revert "…"` title of a GitHub revert passes.
 */
export default {
  ...config,
  rules: {
    ...config.rules,
    [TICKET_REFERENCE_RULE]: [RULE_SEVERITY.disabled],
  },
};
