/**
 * Moteur de parsing « Ajout Rapide » façon Todoist, adapté au modèle de
 * l'application (matières, priorités Basse/Moyenne/Haute).
 *
 * Module pur (aucune dépendance React Native), testable avec Jest : on tape
 * une phrase et elle devient une tâche structurée.
 *
 * Syntaxe reconnue (l'ordre des règles compte : les phrases de dates sont
 * consommées en premier, puis les jetons) :
 *   - Dates    : « demain », « après-demain », « ce soir », « le 15 octobre »,
 *                « 15/10 », « lundi », « vendredi prochain », « dans 3 jours »,
 *                « à 14h30 »
 *   - Récurr.  : « chaque jour », « tous les lundis », « tous les 2 jours »,
 *                « le 10 de chaque mois »
 *   - Matière  : `#Mathématiques` (ou préfixe unique, ex. `#Math`)
 *   - Priorité : `p1`..`p4` ou `!!1`..`!!4` (p1 = la plus haute)
 *   - Description : après un double saut de ligne `\n\n` ou le délimiteur `||`
 */

import { Priority } from '@/types';

export interface QuickSubject {
  id: string;
  name: string;
}

export interface QuickAddOptions {
  /** Matières connues (comparaison insensible à la casse, préfixe toléré). */
  subjects?: readonly QuickSubject[];
  /** Référentiel temporel (pour les tests). */
  now?: Date;
}

export interface ParsedDue {
  /** Date locale au format `AAAA-MM-JJ`. */
  date: string;
  /** Heure `HH:MM` (24 h) si fournie, sinon `null`. */
  time: string | null;
  /** Récurrence lisible en français, ex. « Tous les lundis ». */
  recurrence: string | null;
  /** Règle RRULE best effort, ex. `FREQ=WEEKLY;BYDAY=MO`. */
  rrule: string | null;
  /** Texte brut consommé (pour une pastille). */
  raw: string;
}

export interface QuickChip {
  kind: 'date' | 'priority' | 'subject';
  label: string;
  raw: string;
  /** Pour la couleur d'une pastille matière. */
  subjectId?: string;
  /** Pour la couleur d'une pastille priorité. */
  priority?: Priority;
  /** Matière `#…` saisie mais introuvable dans la liste connue. */
  unknown?: boolean;
}

export interface ParsedQuickAdd {
  /** Titre débarrassé des jetons et des phrases de dates. */
  title: string;
  /** Description extraite après `\n\n` ou `||`, sinon chaîne vide. */
  description: string;
  due: ParsedDue | null;
  /** Priorité déduite d'un `p1`..`p4` ; sans jeton, `medium` et `priorityToken` à `false`. */
  priority: Priority;
  /** `true` si la saisie contenait un jeton de priorité. */
  priorityToken: boolean;
  /** Matière reconnue via `#…`, sinon `null`. */
  subject: QuickSubject | null;
  /** `true` si la saisie contenait un `#…` (reconnu ou non). */
  subjectToken: boolean;
  /** Matières `#…` saisies mais introuvables. */
  unknownTokens: string[];
  /** Pastilles à afficher (date, priorité, matière…). */
  chips: QuickChip[];
}

const DEFAULT_PRIORITY: Priority = 'medium';

const priorityLevel = (level: number): Priority =>
  level <= 1 ? 'high' : level === 2 ? 'medium' : 'low';

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

/* ------------------------------------------------------------------ */
/*  Utilitaires de dates (heure locale)                                */
/* ------------------------------------------------------------------ */

const pad2 = (n: number) => `${n}`.padStart(2, '0');

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const;
const WD_RULE = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
] as const;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDaysLocal(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Prochain jour (de la semaine) `weekday`, aujourd'hui inclus si identique. */
function nextWeekday(from: Date, weekday: number): Date {
  const base = startOfDay(from);
  for (let i = 0; i < 7; i += 1) {
    const candidate = addDaysLocal(base, i);
    if (candidate.getDay() === weekday) return candidate;
  }
  return base;
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function withTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const copy = new Date(date);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

/** Reconstruit la date d'échéance : heure exacte, sinon fin de journée. */
export function dueToDate(due: ParsedDue): Date {
  const [year, month, day] = due.date.split('-').map(Number);
  const base = new Date(year, month - 1, day);
  return due.time ? withTime(base, due.time) : new Date(year, month - 1, day, 23, 59, 59, 999);
}

/** Normalise un nom pour la comparaison. */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Retire la ponctuation de fin éventuelle d'un jeton (`#Maths.` → `Maths`). */
function trimPunctuation(text: string): string {
  return text.replace(/[.,;:!?)\]]+$/, '').trim();
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ------------------------------------------------------------------ */
/*  Modèle interne des motifs de date                                  */
/* ------------------------------------------------------------------ */

interface DateContext {
  type: 'today' | 'offset' | 'weekday' | 'weekdayNext' | 'monthday' | 'abs';
  n?: number;
  weekday?: number;
  year?: number;
  month?: number;
  day?: number;
}

interface DateFragment {
  ctx?: DateContext;
  time?: string;
  recurrence?: { label: string; rrule: string };
  raw: string;
}

type DateRule = { re: RegExp; resolve: (m: RegExpExecArray) => DateFragment | null };

const weekdayIndex = (name: string): number => WEEKDAYS.indexOf(name as (typeof WEEKDAYS)[number]);

function buildDateRules(): DateRule[] {
  const wd = '(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)';
  const month = '(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)';

  return [
    // Récurrences longues (d'abord, pour ne pas laisser un mot isolé de côté).
    {
      re: /(?:tous les|chaque)\s+(\d{1,2})\s+jours\b/gi,
      resolve: (m) => ({
        ctx: { type: 'today' },
        recurrence: { label: `Tous les ${m[1]} jours`, rrule: `FREQ=DAILY;INTERVAL=${m[1]}` },
        raw: m[0],
      }),
    },
    {
      re: /(?:tous les|chaque)\s+(\d{1,2})\s+semaines\b/gi,
      resolve: (m) => ({
        ctx: { type: 'today' },
        recurrence: { label: `Tous les ${m[1]} semaines`, rrule: `FREQ=WEEKLY;INTERVAL=${m[1]}` },
        raw: m[0],
      }),
    },
    {
      re: new RegExp(`(?:tous les|chaque)\\s+${wd}s?\\b`, 'gi'),
      resolve: (m) => {
        const w = weekdayIndex(m[1]);
        return {
          ctx: { type: 'weekday', weekday: w },
          recurrence: {
            label: `Tous les ${WEEKDAYS[w]}s`,
            rrule: `FREQ=WEEKLY;BYDAY=${WD_RULE[w]}`,
          },
          raw: m[0],
        };
      },
    },
    {
      re: /le\s+(\d{1,2})\s+de\s+chaque\s+mois\b/gi,
      resolve: (m) => {
        const day = Number(m[1]);
        return {
          ctx: { type: 'monthday', day },
          recurrence: { label: `Le ${day} de chaque mois`, rrule: `FREQ=MONTHLY;BYMONTHDAY=${day}` },
          raw: m[0],
        };
      },
    },
    {
      re: /(?:chaque jour|tous les jours|quotidien(?:nement)?)\b/gi,
      resolve: (m) => ({
        ctx: { type: 'today' },
        recurrence: { label: 'Tous les jours', rrule: 'FREQ=DAILY' },
        raw: m[0],
      }),
    },
    {
      re: /(?:chaque semaine|hebdomadaire(?:ment)?)\b/gi,
      resolve: (m) => ({
        ctx: { type: 'today' },
        recurrence: { label: 'Chaque semaine', rrule: 'FREQ=WEEKLY' },
        raw: m[0],
      }),
    },
    {
      re: /(?:chaque mois|mensuel(?:lement)?)\b/gi,
      resolve: (m) => ({
        ctx: { type: 'today' },
        recurrence: { label: 'Chaque mois', rrule: 'FREQ=MONTHLY' },
        raw: m[0],
      }),
    },

    // Dates relatives.
    {
      re: /après-demain|apres-demain|après demain/gi,
      resolve: (m) => ({ ctx: { type: 'offset', n: 2 }, raw: m[0] }),
    },
    {
      re: /aujourd(?:\s+|')?hui\b/gi,
      resolve: (m) => ({ ctx: { type: 'today' }, raw: m[0] }),
    },
    {
      re: /demain\s+matin/gi,
      resolve: (m) => ({ ctx: { type: 'offset', n: 1 }, time: '09:00', raw: m[0] }),
    },
    {
      re: /demain\s+soir/gi,
      resolve: (m) => ({ ctx: { type: 'offset', n: 1 }, time: '18:00', raw: m[0] }),
    },
    {
      re: /demain\b/gi,
      resolve: (m) => ({ ctx: { type: 'offset', n: 1 }, raw: m[0] }),
    },
    {
      re: /ce\s+soir\b/gi,
      resolve: (m) => ({ ctx: { type: 'today' }, time: '18:00', raw: m[0] }),
    },
    {
      re: /cette\s+nuit\b/gi,
      resolve: (m) => ({ ctx: { type: 'today' }, time: '22:00', raw: m[0] }),
    },
    {
      re: /dans\s+(?:(\d{1,3})|(une|deux|trois|quatre|cinq|sept|dix|douze))\s+(jours?|heures?|semaines?|mois|ans?)(?=\s|$)/gi,
      resolve: (m) => {
        const words: Record<string, number> = {
          une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, sept: 7, dix: 10, douze: 12,
        };
        const n = m[1] ? Number(m[1]) : (words[m[2].toLowerCase()] ?? 1);
        const unit = m[3];
        const days = unit.startsWith('jour')
          ? n
          : unit.startsWith('semaine')
            ? n * 7
            : unit.startsWith('heure')
              ? 0
              : unit.startsWith('mois')
                ? n * 30
                : n * 365;
        return { ctx: { type: days > 0 ? 'offset' : 'today', n: days || undefined }, raw: m[0] };
      },
    },
    {
      re: /la\s+semaine\s+prochaine\b/gi,
      resolve: (m) => ({ ctx: { type: 'offset', n: 7 }, raw: m[0] }),
    },

    // Jours de la semaine.
    {
      re: new RegExp(`\\b${wd}\\s+prochain\\b`, 'gi'),
      resolve: (m) => ({ ctx: { type: 'weekdayNext', weekday: weekdayIndex(m[1]) }, raw: m[0] }),
    },
    {
      re: new RegExp(`\\b${wd}\\b`, 'gi'),
      resolve: (m) => ({ ctx: { type: 'weekday', weekday: weekdayIndex(m[1]) }, raw: m[0] }),
    },

    // Dates absolues en français.
    {
      re: new RegExp(`le\\s+(\\d{1,2})\\s+${month}\\b`, 'gi'),
      resolve: (m) => ({
        ctx: { type: 'monthday', day: Number(m[1]), month: MONTHS.indexOf(m[2] as never) + 1 },
        raw: m[0],
      }),
    },
    {
      re: new RegExp(`(\\d{1,2})\\s+${month}\\b`, 'gi'),
      resolve: (m) => ({
        ctx: { type: 'monthday', day: Number(m[1]), month: MONTHS.indexOf(m[2] as never) + 1 },
        raw: m[0],
      }),
    },
    {
      re: /le\s+(\d{1,2})(?=\s|$)/gi,
      resolve: (m) => ({ ctx: { type: 'monthday', day: Number(m[1]) }, raw: m[0] }),
    },

    // Dates numériques.
    {
      re: /(?:(\d{4})-(\d{1,2})-(\d{1,2}))|\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/gi,
      resolve: (m) => {
        if (m[1] !== undefined) {
          return { ctx: { type: 'abs', year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }, raw: m[0] };
        }
        const year = m[6] ? Number(m[6]) : undefined;
        return { ctx: { type: 'abs', year, month: Number(m[5]), day: Number(m[4]) }, raw: m[0] };
      },
    },

    // Heures (attachées ensuite à la date consommée, ou à aujourd'hui).
    {
      re: /(?:^|[\s,(])(?:à|a)\s*(\d{1,2})h(?:\s*(\d{2}))?(?:min)?/gi,
      resolve: (m) => ({ time: `${pad2(Number(m[1]))}:${m[2] ?? '00'}`, raw: m[0].trim() }),
    },
    {
      re: /(?:^|[\s,(])(?:à|a)\s*(\d{1,2}):(\d{2})\b/gi,
      resolve: (m) => ({ time: `${pad2(Number(m[1]))}:${m[2]}`, raw: m[0].trim() }),
    },
  ];
}

const DATE_RULES = buildDateRules();

function resolveContext(ctx: DateContext, now: Date): Date {
  const today = startOfDay(now);
  switch (ctx.type) {
    case 'today':
      return today;
    case 'offset':
      return addDaysLocal(today, ctx.n ?? 0);
    case 'weekday':
      return nextWeekday(today, ctx.weekday ?? 0);
    case 'weekdayNext':
      return nextWeekday(addDaysLocal(today, 7), ctx.weekday ?? 0);
    case 'monthday': {
      const year = ctx.year ?? now.getFullYear();
      const month = ctx.month !== undefined ? ctx.month - 1 : now.getMonth();
      let date = new Date(year, month, ctx.day ?? 1);
      if (ctx.year === undefined && ctx.month !== undefined && date < today) {
        date = new Date(year + 1, month, ctx.day ?? 1);
      } else if (ctx.year === undefined && ctx.month === undefined && date < today) {
        date = new Date(year, month + 1, ctx.day ?? 1);
      }
      return date;
    }
    case 'abs': {
      if (ctx.year === undefined) {
        const date = new Date(now.getFullYear(), (ctx.month ?? 1) - 1, ctx.day ?? 1);
        return date < today ? new Date(now.getFullYear() + 1, (ctx.month ?? 1) - 1, ctx.day ?? 1) : date;
      }
      return new Date(ctx.year, (ctx.month ?? 1) - 1, ctx.day ?? 1);
    }
  }
}

/** Consomme les règles de dates en retirant le texte reconnu du tampon. */
function extractDates(buffer: string): { buffer: string; fragments: DateFragment[] } {
  let out = buffer;
  const fragments: DateFragment[] = [];
  for (const rule of DATE_RULES) {
    const re = new RegExp(rule.re.source, rule.re.flags);
    let next = '';
    let cursor = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(out)) !== null) {
      const fragment = rule.resolve(match);
      if (fragment) fragments.push(fragment);
      next += out.slice(cursor, match.index) + ' ';
      cursor = match.index + match[0].length;
      re.lastIndex = cursor;
    }
    next += out.slice(cursor);
    out = next;
  }
  return { buffer: out, fragments };
}

/** Concatène fragments de date : première date, sa récurrence et son heure. */
function buildDueInfo(fragments: DateFragment[], now: Date): ParsedDue | null {
  const ctxFrag = fragments.find((f) => f.ctx);
  const recFrag = fragments.find((f) => f.recurrence);
  const timeFrag = fragments.find((f) => f.time);
  if (!ctxFrag && !recFrag && !timeFrag) return null;

  let date = ctxFrag ? resolveContext(ctxFrag.ctx!, now) : startOfDay(now);
  if (timeFrag?.time) date = withTime(date, timeFrag.time);

  const unique = new Set<DateFragment>([ctxFrag, recFrag, timeFrag].filter(Boolean) as DateFragment[]);
  const rawParts = [...unique].map((f) => f.raw).filter(Boolean);
  return {
    date: localDateKey(date),
    time: timeFrag?.time ?? null,
    recurrence: recFrag?.recurrence?.label ?? null,
    rrule: recFrag?.recurrence?.rrule ?? null,
    raw: rawParts.join(' '),
  };
}

/* ------------------------------------------------------------------ */
/*  Jetons # et priorités p/!!                                          */
/* ------------------------------------------------------------------ */

const SIGIL_RE = /(?:^|[\s,(])([#][^\s#]+)/g;

const PRIORITY_RE = /(?:^|[\s,(])(?:(p)([1-4])|(!!)([1-4]))(?=[\s,.)!?]|$)/gi;

function splitDescription(input: string): [string, string] {
  const doubleBreak = input.indexOf('\n\n');
  if (doubleBreak !== -1) {
    return [input.slice(0, doubleBreak), input.slice(doubleBreak + 2)];
  }
  const delimiter = input.indexOf(' || ');
  if (delimiter !== -1) {
    return [input.slice(0, delimiter), input.slice(delimiter + 4)];
  }
  return [input, ''];
}

/** Libellé lisible d'une échéance, ex. « Demain à 14h30 ». */
export function prettyDue(due: ParsedDue): string {
  const recurrence = due.recurrence ? ` (${due.recurrence})` : '';
  return `${capitalize(due.raw)}${recurrence}`;
}

export function parseQuickAdd(input: string, opts?: QuickAddOptions): ParsedQuickAdd {
  const subjects = opts?.subjects ?? [];
  const now = opts?.now ?? new Date();

  const [titleBlockRaw, description] = splitDescription(input);
  const buffer = titleBlockRaw.replace(/\s+/g, ' ').trim();

  // 1) Dates & récurrences.
  const { buffer: afterDates, fragments } = extractDates(buffer);
  const due = buildDueInfo(fragments, now);

  // 2) Matières `#…`.
  const subjectTokens: string[] = [];
  const unknownTokens: string[] = [];

  let titleBuffer = afterDates.replace(SIGIL_RE, (match, token) => {
    const body = trimPunctuation(token.slice(1));
    if (body) subjectTokens.push(body);
    return ' ';
  });

  // 3) Priorités `p1`..`p4` / `!!1`..`!!4`.
  let priority = DEFAULT_PRIORITY;
  let priorityToken = false;
  titleBuffer = titleBuffer.replace(PRIORITY_RE, (match, p, pd, b, bd) => {
    priority = priorityLevel(Number(pd ?? bd));
    priorityToken = true;
    return ' ';
  });

  const title = titleBuffer.replace(/\s+/g, ' ').trim();

  // 4) Résolution des matières par nom exact, sinon préfixe unique.
  let subject: QuickSubject | null = null;
  for (const token of subjectTokens) {
    const normalized = normalizeName(token);
    const exact = subjects.find((s) => normalizeName(s.name) === normalized);
    const prefix = exact ? [exact] : subjects.filter((s) => normalizeName(s.name).startsWith(normalized));
    if (prefix.length === 1) {
      subject = prefix[0];
      break;
    }
    unknownTokens.push(token);
  }

  // 5) Pastilles pour l'interface.
  const chips: QuickChip[] = [];
  if (due) chips.push({ kind: 'date', label: prettyDue(due), raw: due.raw });
  if (priorityToken) {
    chips.push({ kind: 'priority', label: PRIORITY_LABELS[priority], raw: priority, priority });
  }
  if (subject) {
    chips.push({ kind: 'subject', label: subject.name, raw: `#${subject.name}`, subjectId: subject.id });
  }
  unknownTokens.forEach((token) => {
    chips.push({ kind: 'subject', label: token, raw: `#${token}`, unknown: true });
  });

  return {
    title,
    description: description.trim(),
    due,
    priority,
    priorityToken,
    subject,
    subjectToken: subjectTokens.length > 0,
    unknownTokens,
    chips,
  };
}