import { addDays, daysBetween, fromDateKey, isSameDay, isSameMonth, toDateKey } from '@/lib/date';

describe('toDateKey', () => {
  it('formate la date en heure locale', () => {
    expect(toDateKey(new Date(2026, 2, 10, 14, 30))).toBe('2026-03-10');
  });

  it('complète le mois et le jour sur deux chiffres', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('ne décale pas la journée pour une échéance de fin de soirée (régression du bug UTC)', () => {
    // Avec toISOString(), une tâche due à 23 h dans un fuseau positif
    // basculait au lendemain (ou à la veille) selon le décalage.
    const lateEvening = new Date(2026, 2, 10, 23, 45);
    expect(toDateKey(lateEvening)).toBe('2026-03-10');

    const earlyMorning = new Date(2026, 2, 10, 0, 15);
    expect(toDateKey(earlyMorning)).toBe('2026-03-10');
  });
});

describe('fromDateKey', () => {
  it('reconstruit une date locale à midi par défaut', () => {
    const date = fromDateKey('2026-03-10');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(10);
    expect(date.getHours()).toBe(12);
  });

  it('fait un aller-retour stable avec toDateKey', () => {
    expect(toDateKey(fromDateKey('2026-12-31'))).toBe('2026-12-31');
  });
});

describe('comparaisons', () => {
  it('isSameDay ignore l’heure', () => {
    expect(isSameDay(new Date(2026, 2, 10, 1), new Date(2026, 2, 10, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 2, 10), new Date(2026, 2, 11))).toBe(false);
  });

  it('isSameMonth distingue les années', () => {
    expect(isSameMonth(new Date(2026, 2, 1), new Date(2026, 2, 28))).toBe(true);
    expect(isSameMonth(new Date(2025, 2, 1), new Date(2026, 2, 1))).toBe(false);
  });

  it('addDays et daysBetween sont cohérents', () => {
    const start = new Date(2026, 2, 10, 12);
    expect(daysBetween(start, addDays(start, 7))).toBe(7);
  });
});
