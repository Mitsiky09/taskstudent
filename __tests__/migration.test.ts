import { migrateTask, migrateTasks } from '@/lib/migration';
import { toCSV, toJSON } from '@/lib/serialize';
import { makeTask } from './factories';

describe('migrateTask', () => {
  it('convertit le nom de matière de l’ancien modèle en identifiant', () => {
    const legacy = {
      id: 'a1',
      title: 'Devoir maison',
      subject: 'Mathématiques',
      subjectColor: '#4f46e5',
      dueDate: '2026-03-10T10:00:00.000Z',
      priority: 'high',
      status: 'active',
      subtasks: [],
      attachments: [],
      reminders: [],
      createdAt: '2026-03-01T08:00:00.000Z',
      completedAt: null,
      archivedAt: null,
    };
    const migrated = migrateTask(legacy);
    expect(migrated?.subjectId).toBe('work');
    expect(migrated).not.toHaveProperty('subjectColor');
  });

  it('bascule sur la boîte de réception si le nom est inconnu', () => {
    expect(migrateTask({ id: 'a2', title: 'X', subject: 'Philosophie' })?.subjectId).toBe('inbox');
  });

  it('complète les champs manquants avec des valeurs sûres', () => {
    const migrated = migrateTask({ id: 'a3', title: 'Sans détail' });
    expect(migrated?.priority).toBe('medium');
    expect(migrated?.status).toBe('active');
    expect(migrated?.subtasks).toEqual([]);
    expect(migrated?.description).toBe('');
    expect(migrated?.reportedAt).toBeNull();
    expect(migrated?.durationMinutes).toBeNull();
    expect(migrated?.note).toBe('');
    expect(migrated?.repeat).toBe('none');
  });

  it('conserve les nouveaux champs (report, durée, remarque, répétition)', () => {
    const migrated = migrateTask({
      id: 'a6',
      title: 'Avancé',
      reportedAt: '2026-03-01T08:00:00.000Z',
      durationMinutes: 45,
      note: 'À relire',
      repeat: 'weekly',
    });
    expect(migrated?.reportedAt).toBe('2026-03-01T08:00:00.000Z');
    expect(migrated?.durationMinutes).toBe(45);
    expect(migrated?.note).toBe('À relire');
    expect(migrated?.repeat).toBe('weekly');
  });

  it('rejette les entrées inexploitables', () => {
    expect(migrateTask(null)).toBeNull();
    expect(migrateTask({ title: 'sans identifiant' })).toBeNull();
    expect(migrateTasks('stockage corrompu')).toEqual([]);
  });

  it('conserve une tâche déjà au format courant', () => {
    const task = makeTask({ subjectId: 'shopping' });
    expect(migrateTasks([task])[0]).toEqual(task);
  });

  it('normalise les identifiants de matière hérités vers un projet', () => {
    expect(migrateTask({ id: 'a4', title: 'X', subjectId: 'physics' })?.subjectId).toBe('work');
    expect(migrateTask({ id: 'a5', title: 'Y', subjectId: 'other' })?.subjectId).toBe('inbox');
  });
});

describe('export', () => {
  it('produit un CSV avec en-tête et une ligne par tâche', () => {
    const csv = toCSV([makeTask({ title: 'Révisions' })]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('"Titre"');
    expect(lines[1]).toContain('"Révisions"');
  });

  it('échappe les guillemets selon la RFC 4180', () => {
    const csv = toCSV([makeTask({ title: 'Lire "Candide"' })]);
    expect(csv).toContain('"Lire ""Candide"""');
  });

  it('produit un JSON relisible', () => {
    const parsed = JSON.parse(toJSON([makeTask()]));
    expect(parsed.tasks).toHaveLength(1);
    expect(typeof parsed.exportedAt).toBe('string');
  });
});
