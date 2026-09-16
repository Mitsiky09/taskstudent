import { dueToDate, parseQuickAdd, prettyDue } from '@/lib/quickadd';

const NOW = new Date(2025, 0, 6, 10, 0); // lundi 6 janvier 2025

const SUBJECTS = [
  { id: 'math', name: 'Mathématiques' },
  { id: 'physics', name: 'Physique' },
  { id: 'history', name: 'Histoire' },
  { id: 'languages', name: 'Langues' },
];

describe('parseQuickAdd — syntaxe complète', () => {
  it('extrait titre, date, heure, matière et priorité', () => {
    const parsed = parseQuickAdd('Acheter un livre demain à 14h30 #Langues p1', {
      subjects: SUBJECTS,
      now: NOW,
    });
    expect(parsed.title).toBe('Acheter un livre');
    expect(parsed.priority).toBe('high');
    expect(parsed.priorityToken).toBe(true);
    expect(parsed.subject).toEqual({ id: 'languages', name: 'Langues' });
    expect(parsed.due).toMatchObject({ date: '2025-01-07', time: '14:30', recurrence: null });
    expect(parsed.unknownTokens).toEqual([]);
    expect(parsed.chips.map((c) => c.kind)).toEqual(['date', 'priority', 'subject']);
  });

  it('gère la récurrence hebdomadaire', () => {
    const parsed = parseQuickAdd('Cours tous les lundis à 9h #Mathématiques', {
      subjects: SUBJECTS,
      now: NOW,
    });
    expect(parsed.title).toBe('Cours');
    expect(parsed.due).toMatchObject({
      date: '2025-01-06',
      time: '09:00',
      recurrence: 'Tous les lundis',
      rrule: 'FREQ=WEEKLY;BYDAY=MO',
    });
    expect(parsed.subject?.id).toBe('math');
  });

  it('résout un préfixe unique de matière', () => {
    expect(parseQuickAdd('Devoir #Phys', { subjects: SUBJECTS, now: NOW }).subject?.id).toBe(
      'physics'
    );
  });

  it('reconnaît la priorité « !!2 »', () => {
    const parsed = parseQuickAdd('Ranger les fichiers !!2', { subjects: SUBJECTS, now: NOW });
    expect(parsed.priority).toBe('medium');
    expect(parsed.priorityToken).toBe(true);
    expect(parsed.title).toBe('Ranger les fichiers');
  });

  it('la dernière priorité mentionnée gagne', () => {
    const parsed = parseQuickAdd('rapport p1 p3', { subjects: SUBJECTS, now: NOW });
    expect(parsed.priority).toBe('low');
    expect(parsed.priorityToken).toBe(true);
    expect(parsed.title).toBe('rapport');
  });

  it('ne confond pas un « p1 » en fin de mot', () => {
    const parsed = parseQuickAdd('Finir supp1', { subjects: SUBJECTS, now: NOW });
    expect(parsed.priorityToken).toBe(false);
    expect(parsed.priority).toBe('medium');
    expect(parsed.title).toBe('Finir supp1');
  });

  it('sans jeton de priorité, priorityToken est false', () => {
    const parsed = parseQuickAdd('Tâche simple demain', { subjects: SUBJECTS, now: NOW });
    expect(parsed.priorityToken).toBe(false);
    expect(parsed.priority).toBe('medium');
  });

  it('ignore un jeton matière collé sans espace', () => {
    const parsed = parseQuickAdd('Acheter un livre#Langues', { subjects: SUBJECTS, now: NOW });
    expect(parsed.title).toBe('Acheter un livre#Langues');
    expect(parsed.subject).toBeNull();
  });

  it('signale une matière inconnue', () => {
    const parsed = parseQuickAdd('Planifier #Nouveaute', { subjects: SUBJECTS, now: NOW });
    expect(parsed.title).toBe('Planifier');
    expect(parsed.subject).toBeNull();
    expect(parsed.subjectToken).toBe(true);
    expect(parsed.unknownTokens).toEqual(['Nouveaute']);
    expect(parsed.chips).toEqual([{ kind: 'subject', label: 'Nouveaute', raw: '#Nouveaute', unknown: true }]);
  });
});

describe('parseQuickAdd — dates en langage naturel', () => {
  it('traduit « demain »', () => {
    expect(parseQuickAdd('Lire un chapitre demain', { subjects: SUBJECTS, now: NOW }).due).toMatchObject({
      date: '2025-01-07',
      time: null,
    });
  });

  it('traduit « après-demain »', () => {
    expect(parseQuickAdd('RDV après-demain', { subjects: SUBJECTS, now: NOW }).due?.date).toBe('2025-01-08');
  });

  it('traduit « dans 3 jours »', () => {
    expect(parseQuickAdd('Rendu dans 3 jours', { subjects: SUBJECTS, now: NOW }).due?.date).toBe('2025-01-09');
  });

  it('traduit « le 15 octobre »', () => {
    expect(parseQuickAdd('Réviser le 15 octobre', { subjects: SUBJECTS, now: NOW }).due).toMatchObject({
      date: '2025-10-15',
      time: null,
    });
  });

  it('traduit une date numérique et une heure « à 15:00 »', () => {
    const parsed = parseQuickAdd('Exam le 15/10 à 15:00', { subjects: SUBJECTS, now: NOW });
    expect(parsed.due).toMatchObject({ date: '2025-10-15', time: '15:00' });
  });

  it('traduit « chaque jour à 7h » en récurrence quotidienne', () => {
    const parsed = parseQuickAdd('Yoga chaque jour à 7h', { subjects: SUBJECTS, now: NOW });
    expect(parsed.due).toMatchObject({
      date: '2025-01-06',
      time: '07:00',
      recurrence: 'Tous les jours',
      rrule: 'FREQ=DAILY',
    });
  });

  it('traduit « vendredi prochain »', () => {
    // lundi 6 janvier 2025 -> vendredi de la semaine suivante = 17 janvier.
    expect(parseQuickAdd('Sortie vendredi prochain', { subjects: SUBJECTS, now: NOW }).due?.date).toBe(
      '2025-01-17'
    );
  });

  it('une heure seule vaut pour aujourd’hui', () => {
    const parsed = parseQuickAdd('Répondre au mail à 16h', { subjects: SUBJECTS, now: NOW });
    expect(parsed.due).toMatchObject({ date: '2025-01-06', time: '16:00' });
    expect(parsed.title).toBe('Répondre au mail');
  });

  it('sans phrase de date, due est null', () => {
    expect(parseQuickAdd('Juste un titre', { subjects: SUBJECTS, now: NOW }).due).toBeNull();
  });
});

describe('parseQuickAdd — description', () => {
  it('sépare la description après un double saut de ligne', () => {
    const parsed = parseQuickAdd('Rédiger le rapport\n\nVoir le chap. 2\nDétailler', {
      subjects: SUBJECTS,
      now: NOW,
    });
    expect(parsed.title).toBe('Rédiger le rapport');
    expect(parsed.description).toBe('Voir le chap. 2\nDétailler');
  });

  it('sépare la description via le délimiteur "||"', () => {
    const parsed = parseQuickAdd('Rédiger le rapport || Une brève description', {
      subjects: SUBJECTS,
      now: NOW,
    });
    expect(parsed.title).toBe('Rédiger le rapport');
    expect(parsed.description).toBe('Une brève description');
  });
});

describe('dueToDate et prettyDue', () => {
  it('construit une heure exacte quand une heure est donnée', () => {
    const parsed = parseQuickAdd('Tâche demain à 14h30', { subjects: SUBJECTS, now: NOW });
    const date = dueToDate(parsed.due!);
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(7);
    expect(date.getHours()).toBe(14);
    expect(date.getMinutes()).toBe(30);
  });

  it('retombe en fin de journée sans heure', () => {
    const parsed = parseQuickAdd('Tâche demain', { subjects: SUBJECTS, now: NOW });
    const date = dueToDate(parsed.due!);
    expect(date.getHours()).toBe(23);
    expect(date.getMinutes()).toBe(59);
  });

  it('affiche la récurrence dans le libellé', () => {
    const parsed = parseQuickAdd('Yoga chaque jour', { subjects: SUBJECTS, now: NOW });
    expect(prettyDue(parsed.due!)).toBe('Chaque jour (Tous les jours)');
  });
});