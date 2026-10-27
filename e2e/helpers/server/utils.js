import { createServer } from 'node:net';
import { ANY_FREE_PORT, PREVIEW_HOST } from './constants.js';

/**
 * Asks the system for a TCP port that nothing listens on, by opening a server on port 0 and
 * closing it at once.
 *
 * @returns {Promise<number>} A free port of `PREVIEW_HOST`.
 */
export function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(ANY_FREE_PORT, PREVIEW_HOST, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}
