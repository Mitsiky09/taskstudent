import {
  applyAutoArchive,
  archivedThisMonth,
  buildTrend,
  completedPerDay,
  computeStats,
  filterTasks,
  groupBySubject,
  isOverdue,
  isReported,
  nextOccurrence,
  searchTasks,
  sortTasks,
  statsForRange,
  tasksDueOn,
  upcomingTasks,
  visibleTasks,
} from '@/lib/tasks';
import { toDateKey } from '@/lib/date';
import { makeTask } from './factories';

const NOW = new Date(2026, 2, 10, 12, 0);

describe('isOverdue', () => {
  it('signale une tâche active dont l’échéance est passée', () => {
    const task = makeTask({ dueDate: new Date(2026, 2, 9).toISOString() });
    expect(isOverdue(task, NOW)).toBe(true);
  });

  it('ne signale pas une tâche terminée', () => {
    const task = makeTask({
      dueDate: new Date(2026, 2, 9).toISOString(),
      status: 'completed',
      completedAt: new Date(2026, 2, 8).toISOString(),
    });
    expect(isOverdue(task, NOW)).toBe(false);
  });
});

describe('isReported', () => {
  it('signale une tâche active reportée', () => {
    const reported = makeTask({ reportedAt: NOW.toISOString() });
    expect(isReported(reported)).toBe(true);
  });

  it('ne signale ni une tâche jamais reportée ni une tâche terminée', () => {
    expect(isReported(makeTask())).toBe(false);
    expect(
      isReported(
        makeTask({
          reportedAt: NOW.toISOString(),
          status: 'completed',
          completedAt: NOW.toISOString(),
        })
      )
    ).toBe(false);
  });
});

describe('filterTasks « Reportées »', () => {
  it('ne garde que les tâches reportées actives', () => {
    const reported = makeTask({ reportedAt: NOW.toISOString() });
    const normal = makeTask();
    const done = makeTask({
      reportedAt: NOW.toISOString(),
      status: 'completed',
      completedAt: NOW.toISOString(),
    });
    expect(filterTasks([reported, normal, done], 'reported', NOW)).toEqual([reported]);
  });
});

describe('nextOccurrence', () => {
  it('avance d’un jour, d’une semaine ou d’un mois selon la règle', () => {
    const due = new Date(2026, 2, 10, 14, 30);
    expect(nextOccurrence(due, 'daily')?.getDate()).toBe(11);
    expect(nextOccurrence(due, 'weekly')?.getDate()).toBe(17);
    expect(nextOccurrence(due, 'monthly')).toEqual(new Date(2026, 3, 10, 14, 30));
  });

  it('retourne null pour une tâche non répétée', () => {
    expect(nextOccurrence(new Date(2026, 2, 10), 'none')).toBeNull();
  });
});

describe('filterTasks', () => {
  const overdue = makeTask({ dueDate: new Date(2026, 2, 8).toISOString() });
  const soon = makeTask({ dueDate: new Date(2026, 2, 12).toISOString() });
  const later = makeTask({ dueDate: new Date(2026, 3, 30).toISOString() });
  const done = makeTask({
    dueDate: new Date(2026, 2, 11).toISOString(),
    status: 'completed',
    completedAt: NOW.toISOString(),
  });
  const all = [overdue, soon, later, done];

  it('« Toutes » conserve la liste sans la muter', () => {
    const result = filterTasks(all, 'all', NOW);
    expect(result).toHaveLength(4);
    expect(result).not.toBe(all);
  });

  it('« En cours » exclut les tâches terminées', () => {
    expect(filterTasks(all, 'active', NOW).map((t) => t.id)).not.toContain(done.id);
  });

  it('« En retard » ne garde que les tâches actives dépassées', () => {
    expect(filterTasks(all, 'overdue', NOW).map((t) => t.id)).toEqual([overdue.id]);
  });

  it('« Cette semaine » borne les sept prochains jours', () => {
    const ids = filterTasks(all, 'week', NOW).map((t) => t.id);
    expect(ids).toContain(soon.id);
    expect(ids).not.toContain(later.id);
    expect(ids).not.toContain(overdue.id);
  });
});

describe('sortTasks', () => {
  const low = makeTask({ priority: 'low', dueDate: new Date(2026, 2, 11).toISOString() });
  const high = makeTask({ priority: 'high', dueDate: new Date(2026, 2, 20).toISOString() });
  const medium = makeTask({ priority: 'medium', dueDate: new Date(2026, 2, 15).toISOString() });

  it('trie par échéance croissante', () => {
    expect(sortTasks([high, low, medium], 'date').map((t) => t.id)).toEqual([
      low.id,
      medium.id,
      high.id,
    ]);
  });

  it('trie par priorité décroissante puis par échéance', () => {
    expect(sortTasks([low, medium, high], 'priority').map((t) => t.id)).toEqual([
      high.id,
      medium.id,
      low.id,
    ]);
  });

  it('ne mute pas le tableau source', () => {
    const source = [high, low];
    sortTasks(source, 'date');
    expect(source.map((t) => t.id)).toEqual([high.id, low.id]);
  });
});

describe('recherche et regroupement', () => {
  const maths = makeTask({ title: 'Exercices de dérivées', subjectId: 'math' });
  const histoire = makeTask({ title: 'Fiche sur la Révolution', subjectId: 'history' });
  const subjectName = (task: typeof maths) =>
    task.subjectId === 'math' ? 'Mathématiques' : 'Histoire';

  it('recherche sans tenir compte de la casse', () => {
    expect(searchTasks([maths, histoire], 'RÉVOLUTION', subjectName)).toHaveLength(1);
  });

  it('recherche aussi dans le nom de la matière', () => {
    expect(searchTasks([maths, histoire], 'mathémat', subjectName)).toEqual([maths]);
  });

  it('renvoie tout pour une requête vide', () => {
    expect(searchTasks([maths, histoire], '   ', subjectName)).toHaveLength(2);
  });

  it('regroupe par matière', () => {
    const grouped = groupBySubject([maths, histoire, makeTask({ subjectId: 'math' })]);
    expect(Object.keys(grouped).sort()).toEqual(['history', 'math']);
    expect(grouped.math).toHaveLength(2);
  });
});

describe('sélections d’écran', () => {
  it('visibleTasks écarte les archives', () => {
    const archived = makeTask({ status: 'archived', archivedAt: NOW.toISOString() });
    expect(visibleTasks([makeTask(), archived])).toHaveLength(1);
  });

  it('tasksDueOn s’appuie sur la clé de jour locale', () => {
    const evening = makeTask({ dueDate: new Date(2026, 2, 10, 22, 0).toISOString() });
    expect(tasksDueOn([evening], toDateKey(new Date(2026, 2, 10)))).toHaveLength(1);
  });

  it('upcomingTasks exclut aujourd’hui et limite le nombre de résultats', () => {
    const tasks = [
      makeTask({ dueDate: new Date(2026, 2, 10, 18).toISOString() }),
      makeTask({ dueDate: new Date(2026, 2, 11).toISOString() }),
      makeTask({ dueDate: new Date(2026, 2, 12).toISOString() }),
      makeTask({ dueDate: new Date(2026, 2, 13).toISOString() }),
      makeTask({ dueDate: new Date(2026, 2, 14).toISOString() }),
    ];
    const result = upcomingTasks(tasks, NOW, 3);
    expect(result).toHaveLength(3);
    expect(result[0].dueDate).toBe(new Date(2026, 2, 11).toISOString());
  });

  it('archivedThisMonth filtre sur le mois courant', () => {
    const current = makeTask({
      status: 'archived',
      archivedAt: new Date(2026, 2, 3).toISOString(),
    });
    const old = makeTask({ status: 'archived', archivedAt: new Date(2026, 0, 3).toISOString() });
    expect(archivedThisMonth([current, old], NOW)).toEqual([current]);
  });
});

describe('computeStats', () => {
  it('calcule le taux de complétion et la répartition par matière', () => {
    const tasks = [
      makeTask({ subjectId: 'math', status: 'completed', completedAt: NOW.toISOString() }),
      makeTask({ subjectId: 'math', dueDate: new Date(2026, 2, 20).toISOString() }),
      makeTask({ subjectId: 'history', dueDate: new Date(2026, 2, 1).toISOString() }),
      makeTask({ subjectId: 'history', status: 'archived', archivedAt: NOW.toISOString() }),
    ];
    const stats = computeStats(tasks, NOW);

    expect(stats.total).toBe(4);
    expect(stats.completed).toBe(1);
    expect(stats.overdue).toBe(1);
    expect(stats.archived).toBe(1);
    expect(stats.completionRate).toBe(25);
    expect(stats.bySubject).toEqual(
      expect.arrayContaining([{ subjectId: 'math', total: 2, completed: 1 }])
    );
  });

  it('évite la division par zéro sur une liste vide', () => {
    expect(computeStats([], NOW).completionRate).toBe(0);
  });
});

describe('statsForRange', () => {
  const start = new Date(2026, 2, 2);
  const end = new Date(2026, 2, 8);
  const NOW = new Date(2026, 2, 4, 12, 0);

  it('compte les tâches dues dans la période et leur statut', () => {
    const inRange = makeTask({ dueDate: new Date(2026, 2, 5).toISOString() });
    const doneInRange = makeTask({
      dueDate: new Date(2026, 2, 5).toISOString(),
      status: 'completed',
      completedAt: new Date(2026, 2, 6).toISOString(),
    });
    const lateInRange = makeTask({ dueDate: new Date(2026, 2, 4).toISOString() });
    const outside = makeTask({ dueDate: new Date(2026, 2, 20).toISOString() });
    const archived = makeTask({
      dueDate: new Date(2026, 2, 5).toISOString(),
      status: 'archived',
      archivedAt: NOW.toISOString(),
    });

    const stats = statsForRange([inRange, doneInRange, lateInRange, outside, archived], start, end, NOW);
    expect(stats.totalDue).toBe(3);
    expect(stats.completed).toBe(1);
    expect(stats.active).toBe(2);
    expect(stats.overdue).toBe(1);
  });

  it('évite la division par zéro', () => {
    expect(statsForRange([], start, end, NOW).completionRate).toBe(0);
  });
});

describe('completedPerDay et buildTrend', () => {
  const start = new Date(2026, 2, 2);
  const end = new Date(2026, 2, 4);
  const monday = new Date(2026, 2, 2);
  expect(monday.getDay()).toBe(1); // garde-fou : la semaine de test commence un lundi

  it('répartit les tâches terminées par jour', () => {
    const tasks = [
      makeTask({ status: 'completed', completedAt: new Date(2026, 2, 2, 9).toISOString() }),
      makeTask({ status: 'completed', completedAt: new Date(2026, 2, 2, 21).toISOString() }),
      makeTask({ status: 'completed', completedAt: new Date(2026, 2, 4, 12).toISOString() }),
      makeTask({ status: 'completed', completedAt: new Date(2026, 1, 20).toISOString() }),
    ];
    const trend = completedPerDay(tasks, start, end);
    expect(trend.map((t) => t.count)).toEqual([2, 0, 1]);
    expect(trend.map((t) => t.dateKey)).toEqual(['2026-03-02', '2026-03-03', '2026-03-04']);
  });

  it('garde un point par jour sous 42 jours', () => {
    const trend = buildTrend([], start, end);
    expect(trend).toHaveLength(3);
  });

  it('agrège par semaine au-delà de 42 jours', () => {
    const longStart = new Date(2026, 0, 1);
    const longEnd = new Date(2026, 1, 28);
    const trend = buildTrend([], longStart, longEnd);
    expect(trend.length).toBeLessThan(10);
  });
});

describe('applyAutoArchive', () => {
  it('archive les tâches terminées depuis plus de sept jours', () => {
    const old = makeTask({
      status: 'completed',
      completedAt: new Date(2026, 2, 1).toISOString(),
    });
    const [archived] = applyAutoArchive([old], NOW);
    expect(archived.status).toBe('archived');
    expect(archived.archivedAt).not.toBeNull();
  });

  it('laisse les tâches terminées récemment', () => {
    const recent = makeTask({
      status: 'completed',
      completedAt: new Date(2026, 2, 9).toISOString(),
    });
    expect(applyAutoArchive([recent], NOW)[0].status).toBe('completed');
  });

  it('retourne la même référence quand rien ne change (évite une écriture inutile)', () => {
    const tasks = [makeTask()];
    expect(applyAutoArchive(tasks, NOW)).toBe(tasks);
  });
});
