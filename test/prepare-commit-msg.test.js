import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const HOOK_FILE = fileURLToPath(new URL('../.husky/prepare-commit-msg', import.meta.url));
const TICKET_BRANCH = 'CHESS-12';
const TICKET_TRAILER = 'Refs: CHESS-12';
const CO_AUTHOR = 'Co-Authored-By: Claude <noreply@anthropic.com>';
/** Git environment of the test repositories, cut off from the Git configuration of the machine. */
const GIT_ENV = {
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))),
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
  LC_ALL: 'C',
};

describe('prepare-commit-msg hook', () => {
  let root;
  let repository;

  /**
   * Runs git in the test repository.
   *
   * @param {object} params
   * @param {string[]} params.args The arguments of git.
   * @param {object} [params.env] More environment variables.
   * @returns {string} The output of git.
   */
  function git({ args, env = {} }) {
    return execFileSync('git', args, {
      cwd: repository,
      env: { ...GIT_ENV, ...env },
      encoding: 'utf8',
      stdio: 'pipe',
    });
  }

  /**
   * Creates an empty commit, running the hook as `git commit` does.
   *
   * @param {...string} args More arguments of `git commit`, such as `-m` and its message.
   * @returns {string} The message of the new commit, without its final newline.
   */
  function commit(...args) {
    git({ args: ['commit', '--quiet', '--allow-empty', ...args] });
    return lastMessage();
  }

  /** @returns {string} The message of the last commit, without its final newline. */
  function lastMessage() {
    return git({ args: ['log', '-1', '--format=%B'] }).trimEnd();
  }

  /**
   * Creates the test repository on the given branch, with the hook installed the way Husky runs it.
   *
   * @param {string} branch The branch of the first commit.
   */
  function createRepository(branch) {
    const hooks = join(root, 'hooks');
    mkdirSync(hooks);
    writeFileSync(join(hooks, 'prepare-commit-msg'), `#!/bin/sh\nexec sh -e "${HOOK_FILE}" "$@"\n`);
    chmodSync(join(hooks, 'prepare-commit-msg'), 0o755);
    execFileSync('git', ['init', '--quiet', '--initial-branch', branch, repository], {
      env: GIT_ENV,
      stdio: 'pipe',
    });
    git({ args: ['config', 'core.hooksPath', hooks] });
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'prepare-commit-msg-'));
    repository = join(root, 'repository');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  describe('on a ticket branch', () => {
    beforeEach(() => {
      createRepository(TICKET_BRANCH);
    });

    it('adds the trailer in a paragraph of its own after the subject', () => {
      expect(commit('-m', 'fix: x')).toBe(`fix: x\n\n${TICKET_TRAILER}`);
    });

    it('adds the trailer after the body', () => {
      expect(commit('-m', 'fix: x', '-m', 'Some body.')).toBe(
        `fix: x\n\nSome body.\n\n${TICKET_TRAILER}`
      );
    });

    it('adds the trailer after the other trailers, without a blank line', () => {
      expect(commit('-m', 'fix: x', '-m', CO_AUTHOR)).toBe(
        `fix: x\n\n${CO_AUTHOR}\n${TICKET_TRAILER}`
      );
    });

    it('adds nothing when the trailer block has a Refs line', () => {
      const message = `fix: x\n\nRefs: CHESS-7\n${CO_AUTHOR}`;

      expect(commit('-m', message)).toBe(message);
    });

    it('adds nothing to a Refs trailer with a space before the colon, left to commitlint', () => {
      const message = 'fix: x\n\nRefs : CHESS-7';

      expect(commit('-m', message)).toBe(message);
    });

    it('adds nothing when an earlier paragraph has a Refs line', () => {
      const message = `fix: x\n\nRefs: CHESS-7\n\n${CO_AUTHOR}`;

      expect(commit('-m', message)).toBe(message);
    });

    it('prepares the editor with a blank line between the subject and the trailer', () => {
      const editor = join(root, 'editor.sh');
      const template = join(root, 'template.txt');
      // Keeps a copy of the message that the editor opens with, then types the subject on line 1.
      const editorScript = [
        '#!/bin/sh',
        `cp "$1" "${template}"`,
        `{ printf 'feat: x'; cat "$1"; } > "$1.new"`,
        'mv "$1.new" "$1"',
      ];
      writeFileSync(editor, `${editorScript.join('\n')}\n`);
      chmodSync(editor, 0o755);

      git({ args: ['commit', '--quiet', '--allow-empty'], env: { GIT_EDITOR: editor } });

      expect(readFileSync(template, 'utf8').split('\n').slice(0, 3)).toEqual([
        '',
        '',
        TICKET_TRAILER,
      ]);
      expect(lastMessage()).toBe(`feat: x\n\n${TICKET_TRAILER}`);
    });

    it('leaves fixup commits alone', () => {
      commit('-m', 'fix: x');

      expect(commit('--fixup=HEAD')).toBe('fixup! fix: x');
    });

    it('leaves a detached HEAD alone, as during a rebase', () => {
      commit('-m', 'fix: x');
      git({ args: ['checkout', '--quiet', '--detach'] });

      expect(commit('-m', 'fix: y')).toBe('fix: y');
    });

    it('leaves merge and squash messages alone', () => {
      commit('-m', 'fix: x');
      git({ args: ['checkout', '--quiet', '-b', 'other'] });
      commit('-m', 'fix: y');
      git({ args: ['checkout', '--quiet', TICKET_BRANCH] });
      commit('-m', 'fix: z');

      git({ args: ['merge', '--quiet', '--no-ff', '--no-edit', 'other'] });
      expect(lastMessage()).toBe("Merge branch 'other' into CHESS-12");

      git({ args: ['reset', '--quiet', '--hard', 'HEAD^'] });
      git({ args: ['merge', '--quiet', '--squash', 'other'] });
      git({ args: ['commit', '--quiet', '--allow-empty'], env: { GIT_EDITOR: 'true' } });
      expect(lastMessage()).toMatch(/^Squashed commit of the following:/);
      expect(lastMessage()).not.toMatch(/^Refs:/m);
    });
  });

  it.each(['master', 'CHESS-12-follow-up', 'feature/CHESS-12', 'chess-12', 'CHESS-', 'CHESS-0'])(
    'leaves the commits of the branch %s alone',
    (branch) => {
      createRepository(branch);

      expect(commit('-m', 'fix: x')).toBe('fix: x');
    }
  );

  it('leaves an amended commit alone', () => {
    createRepository('master');
    commit('-m', 'fix: x');
    git({ args: ['checkout', '--quiet', '-b', TICKET_BRANCH] });

    expect(commit('--amend', '--no-edit')).toBe('fix: x');
  });
});
