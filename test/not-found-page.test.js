import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';
import { describe, it, expect } from 'vitest';

/** Folder whose files Vite copies to the root of the site. */
const PUBLIC_DIR = fileURLToPath(import.meta.resolve('../app/public/'));
/** Page that Cloudflare Pages serves with a 404 status at any unknown path. */
const SOURCE = readFileSync(join(PUBLIC_DIR, '404.html'), 'utf8');
const EM_DASH = '\u2014';

describe('404 page', () => {
  const { DOMParser } = new Window();
  const page = new DOMParser().parseFromString(SOURCE, 'text/html');
  const urls = [...page.querySelectorAll('[href], [src]')].map(
    (element) => element.getAttribute('href') ?? element.getAttribute('src')
  );

  it('is in French and names its author', () => {
    expect(page.documentElement.getAttribute('lang')).toBe('fr');
    expect(page.querySelector('meta[name="author"]')?.getAttribute('content')).toBe('ADAM Issoufi');
    expect(page.querySelector('h1')?.textContent).toBe('Page introuvable');
  });

  it('links back to the game', () => {
    const link = page.querySelector('main a');

    expect(link?.getAttribute('href')).toBe('/');
    expect(link?.textContent).toBe('Retour à la partie');
  });

  it('shows the favicon of the site', () => {
    const href = page.querySelector('link[rel="icon"]')?.getAttribute('href');

    expect(href).toBe('/favicon.svg');
    expect(existsSync(join(PUBLIC_DIR, href))).toBe(true);
  });

  it('only uses root-absolute URLs, so that it works at any depth', () => {
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toMatch(/^\/(?!\/)/);
    }
  });

  it('loads its own stylesheet of the public folder, with no script', () => {
    const stylesheets = [...page.querySelectorAll('link[rel="stylesheet"]')].map((link) =>
      link.getAttribute('href')
    );

    expect(stylesheets).toEqual(['/404.css']);
    expect(existsSync(join(PUBLIC_DIR, '404.css'))).toBe(true);
    expect(page.querySelectorAll('script')).toHaveLength(0);
  });

  it('holds no inline style, which the Content Security Policy blocks', () => {
    expect(page.querySelectorAll('style, [style]')).toHaveLength(0);
  });

  it('holds no event handler attribute, which the Content Security Policy blocks', () => {
    const handlerAttributes = [...page.querySelectorAll('*')].flatMap((element) =>
      element.getAttributeNames().filter((name) => name.startsWith('on'))
    );

    expect(handlerAttributes).toEqual([]);
  });

  it('holds no em dash, written or as an entity', () => {
    expect(SOURCE).not.toContain(EM_DASH);
    expect(page.documentElement.textContent).not.toContain(EM_DASH);
  });
});
