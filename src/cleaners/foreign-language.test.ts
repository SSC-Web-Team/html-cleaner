import { expect, test } from 'vitest';
import { JSDOM } from 'jsdom';

import {
  findForeignLanguageOccurrences,
  wrapForeignLanguageOccurrences,
} from './foreign-language.ts';

test('finds French words in English text but excludes dictionary overlaps', () => {
  const { document } = new JSDOM('<p>Say bonjour and hello.</p>').window;

  const occurrences = findForeignLanguageOccurrences(document, 'en');

  expect(occurrences.map(({ word }) => word)).toContain('bonjour');
  expect(occurrences.map(({ word }) => word)).not.toContain('hello');
  expect(occurrences[0].languageTag).toBe('fr-CA');
});

test('excludes words accepted by both dictionaries', () => {
  const { document } = new JSDOM('<p>An animal restaurant.</p>').window;

  const occurrences = findForeignLanguageOccurrences(document, 'en');

  expect(occurrences).toEqual([]);
});

test('finds English words in French text', () => {
  const { document } = new JSDOM('<p>Le throughput est important.</p>').window;

  const occurrences = findForeignLanguageOccurrences(document, 'fr');

  expect(occurrences.map(({ word }) => word)).toContain('throughput');
  expect(occurrences.find(({ word }) => word === 'throughput')?.languageTag).toBe('en-CA');
});

test('groups a French sentence into one occurrence and wraps it once', () => {
  const { document } = new JSDOM('<p>Bonjour, allez-vous beaucoup mieux?</p>').window;
  const occurrences = findForeignLanguageOccurrences(document, 'en');

  expect(occurrences.map(({ word }) => word)).toEqual(['Bonjour, allez-vous beaucoup mieux?']);

  wrapForeignLanguageOccurrences(document, 'en', [0]);

  expect(document.querySelectorAll('span[lang="fr-CA"]')).toHaveLength(1);
  expect(document.querySelector('span[lang="fr-CA"]')?.textContent).toBe(
    'Bonjour, allez-vous beaucoup mieux?',
  );
});

test('groups an English sentence into one occurrence and wraps it once', () => {
  const { document } = new JSDOM(
    '<p>Issued also in <strong>English</strong> under title:<br>Shared Services Canada 2025-26 Departmental Results Report</p>',
  ).window;
  const occurrences = findForeignLanguageOccurrences(document, 'fr');

  expect(occurrences.map(({ word }) => word)).toEqual([
    'Issued also in English under title: Shared Services Canada 2025-26 Departmental Results Report',
  ]);

  wrapForeignLanguageOccurrences(document, 'fr', [0]);

  expect(document.querySelectorAll('span[lang="en-CA"]')).toHaveLength(1);
  expect(document.querySelector('span[lang="en-CA"]')?.innerHTML).toBe(
    'Issued also in <strong>English</strong> under title:<br>Shared Services Canada 2025-26 Departmental Results Report',
  );
});

test('keeps individual words as candidates in mixed-language sentences', () => {
  const { document } = new JSDOM('<p>We need bonjour today.</p>').window;

  const occurrences = findForeignLanguageOccurrences(document, 'en');

  expect(occurrences.map(({ word }) => word)).toEqual(['bonjour']);
});

test('does not identify or wrap email addresses', () => {
  const { document } = new JSDOM('<p>bonjour@example.fr</p>').window;

  const occurrences = findForeignLanguageOccurrences(document, 'en');

  expect(occurrences).toEqual([]);

  wrapForeignLanguageOccurrences(document, 'en', [0]);

  expect(document.querySelector('p')?.innerHTML).toBe('bonjour@example.fr');
});

test('does not wrap an email address inside a foreign-language sentence', () => {
  const email = 'bonjour@example.fr';
  const { document } = new JSDOM(`<p>Bonjour, merci de contacter ${email} maintenant!</p>`).window;
  const occurrences = findForeignLanguageOccurrences(document, 'en');

  wrapForeignLanguageOccurrences(
    document,
    'en',
    occurrences.map((_, index) => index),
  );

  expect(document.body.textContent).toContain(email);
  expect(
    Array.from(document.querySelectorAll('span[lang="fr-CA"]')).some((span) =>
      span.textContent?.includes(email),
    ),
  ).toBe(false);
});

test('wraps only selected occurrences and leaves code or already tagged text alone', () => {
  const { document } = new JSDOM(
    '<p><code>bonjour</code> <span lang="fr-CA">salut</span> bonjour bonjour</p>',
  ).window;
  const occurrences = findForeignLanguageOccurrences(document, 'en');

  wrapForeignLanguageOccurrences(document, 'en', [1]);

  expect(occurrences.map(({ word }) => word)).toEqual(['bonjour', 'bonjour']);
  expect(document.querySelectorAll('span[lang="fr-CA"]')).toHaveLength(2);
  expect(document.querySelector('span[lang="fr-CA"]:last-child')?.textContent).toBe('bonjour');
  expect(document.querySelector('code')?.textContent).toBe('bonjour');
});
