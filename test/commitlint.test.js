import { fileURLToPath } from 'node:url';
import lint from '@commitlint/lint';
import load from '@commitlint/load';
import { beforeAll, describe, expect, it } from 'vitest';
import { TICKET_REFERENCE_ERROR, TICKET_REFERENCE_RULE } from '../commitlint/constants.js';
import { hasTicketReference, isBotCommit, ticketReference } from '../commitlint/utils.js';

const COMMIT_CONFIG_FILE = fileURLToPath(new URL('../commitlint.config.js', import.meta.url));
const PR_TITLE_CONFIG_FILE = fileURLToPath(
  new URL('../commitlint/pr-title.config.js', import.meta.url)
);
const CO_AUTHOR = 'Co-Authored-By: Claude <noreply@anthropic.com>';
/** `header-max-length` of `@commitlint/config-conventional`. */
const HEADER_MAX_LENGTH = 100;
const DEPENDABOT_COMMIT = `build(deps-dev): bump @commitlint/config-conventional from 20.5.0 to 21.2.4

Bumps [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint/tree/HEAD/@commitlint/config-conventional) from 20.5.0 to 21.2.4.
- [Release notes](https://github.com/conventional-changelog/commitlint/releases)
- [Changelog](https://github.com/conventional-changelog/commitlint/blob/master/@commitlint/config-conventional/CHANGELOG.md)

---
updated-dependencies:
- dependency-name: "@commitlint/config-conventional"
  dependency-version: 21.2.4
  dependency-type: direct:development
  update-type: version-update:semver-major
...

Signed-off-by: dependabot[bot] <support@github.com>`;

/**
 * Lints a message as the commitlint CLI does with the given configuration.
 *
 * @param {object} params
 * @param {object} params.config A configuration, as `@commitlint/load` resolves it.
 * @param {string} params.message The commit message.
 * @returns {Promise<{ valid: boolean, errors: string[] }>} Whether the message passes, and the
 *   names of the rules it breaks.
 */
async function lintMessage({ config, message }) {
  const { valid, errors } = await lint(message, config.rules, {
    defaultIgnores: config.defaultIgnores,
    ignores: config.ignores,
    parserOpts: config.parserPreset?.parserOpts,
    plugins: config.plugins,
  });
  return { valid, errors: errors.map(({ name }) => name) };
}

describe('hasTicketReference', () => {
  it.each([
    ['the body', { body: 'Refs: CHESS-12' }],
    ['the footer', { footer: 'Refs: CHESS-12' }],
    ['the footer after a body', { body: 'Some body.', footer: 'Closes #12\nRefs: CHESS-12' }],
    ['a list of tickets', { body: 'Refs: CHESS-3, CHESS-4' }],
  ])('finds a reference in %s', (_, parsed) => {
    expect(hasTicketReference(parsed)).toBe(true);
  });

  it.each([undefined, null, {}, { body: null, footer: null }, { body: 42 }, { body: ['Refs'] }])(
    'finds no reference in %j',
    (parsed) => {
      expect(hasTicketReference(parsed)).toBe(false);
    }
  );
});

describe('ticketReference', () => {
  it('passes with a reference and gives the error to show otherwise', () => {
    expect(ticketReference({ body: 'Refs: CHESS-12' })).toEqual([true, TICKET_REFERENCE_ERROR]);
    expect(ticketReference({ body: 'No ticket.' })).toEqual([false, TICKET_REFERENCE_ERROR]);
  });

  it('fails without a parsed commit', () => {
    expect(ticketReference()).toEqual([false, TICKET_REFERENCE_ERROR]);
  });
});

describe('isBotCommit', () => {
  it.each([
    'chore(master): release 2.1.0',
    'chore(main): release chess 2.1.0',
    'chore: release v2.1.0',
    'chore(master): release 3.0.0-rc.1',
    'chore(master): release 2.1.0\r\n\r\nThe release notes.',
    DEPENDABOT_COMMIT,
  ])('recognizes the commit of a bot: %j', (message) => {
    expect(isBotCommit(message)).toBe(true);
  });

  it.each([
    'chore: release notes for the next version',
    'chore(master): release',
    'feat: release 2.1.0',
    'fix: x\n\nchore(master): release 2.1.0',
    'fix: x\n\nSigned-off-by: Adam Issoufi <adam@example.com>',
    'fix: x\n\nCo-Authored-By: dependabot[bot] <support@github.com>',
    '',
  ])('does not take a human commit for a bot one: %j', (message) => {
    expect(isBotCommit(message)).toBe(false);
  });

  it.each([undefined, null, 42, {}])('returns false for the non-string %j', (message) => {
    expect(isBotCommit(message)).toBe(false);
  });
});

describe('commit messages', () => {
  let config;

  beforeAll(async () => {
    config = await load({}, { file: COMMIT_CONFIG_FILE });
  });

  it.each([
    ['a trailer alone', 'fix: x\n\nRefs: CHESS-12'],
    ['a body and a trailer block', `feat: x\n\nSome body.\n\nRefs: CHESS-12\n${CO_AUTHOR}`],
    ['the reference in an earlier paragraph', `fix: x\n\nRefs: CHESS-12\n\n${CO_AUTHOR}`],
    ['several tickets', 'fix: x\n\nRefs: CHESS-3, CHESS-4'],
    ['a breaking change note', 'feat!: x\n\nBREAKING CHANGE: y\nRefs: CHESS-12'],
    ['an issue reference', 'fix: x\n\nCloses #12\nRefs: CHESS-12'],
  ])('accepts a reference in %s', async (_, message) => {
    expect(await lintMessage({ config, message })).toEqual({ valid: true, errors: [] });
  });

  it.each([
    'fix: x',
    'fix: x\n\nSome body.',
    'fix: refs CHESS-12 in the header',
    'fix: x\n\nSee CHESS-12.',
    'fix: x\n\nRefs: #12',
    'fix: x\n\nRefs: ISF-12',
    'fix: x\n\nRefs: CHESS-',
    'fix: x\n\nRefs: CHESS-0',
    'fix: x\n\nRefs: CHESS-12a',
    'fix: x\n\nrefs: CHESS-12',
    'fix: x\n\nRefs CHESS-12',
    'fix: x\n\n  Refs: CHESS-12',
    'fix: x\n\nSigned-off-by: Adam Issoufi <adam@example.com>',
    'chore: release notes for the next version',
  ])('refuses a commit without a ticket reference: %j', async (message) => {
    expect(await lintMessage({ config, message })).toEqual({
      valid: false,
      errors: [TICKET_REFERENCE_RULE],
    });
  });

  it('still checks the Conventional Commits format', async () => {
    const { errors } = await lintMessage({
      config,
      message: 'Update the board\n\nRefs: CHESS-12',
    });

    expect(errors).toEqual(expect.arrayContaining(['type-empty', 'subject-empty']));
  });

  it.each([
    'Merge pull request #30 from AIssoufi/CHESS-15',
    "Merge branch 'master' into CHESS-12",
    "Merge remote-tracking branch 'origin/master' into CHESS-12",
    'Revert "fix: x"\n\nThis reverts commit ac49ab2.',
    'fixup! fix: x',
    'chore(master): release 2.1.0',
    DEPENDABOT_COMMIT,
  ])('ignores the merge, revert, fixup and bot commit %j', async (message) => {
    expect(await lintMessage({ config, message })).toEqual({ valid: true, errors: [] });
  });

  it('links the commit conventions from its errors', () => {
    expect(config.helpUrl).toBe('https://github.com/AIssoufi/chess#conventions');
  });
});

describe('pull request titles', () => {
  let config;

  beforeAll(async () => {
    config = await load({}, { file: PR_TITLE_CONFIG_FILE });
  });

  it('accepts a conventional title without a ticket reference', async () => {
    const message = 'fix: drop the em dash from the stalemate message';

    expect(await lintMessage({ config, message })).toEqual({ valid: true, errors: [] });
  });

  it('refuses a title that is not a conventional commit header', async () => {
    const { valid, errors } = await lintMessage({ config, message: 'Fix the stalemate message' });

    expect(valid).toBe(false);
    expect(errors).toEqual(expect.arrayContaining(['type-empty', 'subject-empty']));
  });

  it('refuses a title longer than a commit header', async () => {
    const message = `fix: ${'x'.repeat(HEADER_MAX_LENGTH)}`;
    const { errors } = await lintMessage({ config, message });

    expect(errors).toContain('header-max-length');
  });
});
