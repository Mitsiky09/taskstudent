import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';
import '../viewmodels/settings_viewmodel.dart';
import '../viewmodels/tasks_viewmodel.dart';
import '../widgets/task_tile.dart';
import 'task_detail_screen.dart';

/// Onglet « Aujourd'hui » : ce qui demande ton attention maintenant.
///
/// Port de `app/(tabs)/upcoming.tsx`. Trois sections, calculées par le noyau :
/// le retard, le jour même, puis les trois prochaines échéances.
class TodayScreen extends ConsumerWidget {
  /// Onglet « Aujourd'hui ».
  const TodayScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(tasksProvider);
    final categories = ref.watch(settingsProvider).settings.categories;
    final now = DateTime.now();
    final visible = visibleTasks(state.tasks);

    final late = visible.where((task) => isOverdue(task, now)).toList(growable: false);
    final today =
        visible.where((task) => isDueToday(task, now)).toList(growable: false);
    final next = upcomingTasks(state.tasks, now, 3);

    return Scaffold(
      appBar: AppBar(title: const Text("Aujourd'hui")),
      body: RefreshIndicator(
        onRefresh: ref.read(tasksProvider.notifier).refresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.screen,
            4,
            AppSpacing.screen,
            120,
          ),
          children: <Widget>[
            _SummaryCard(late: late.length, today: today.length, next: next.length),
            if (late.isNotEmpty) ...<Widget>[
              const _SectionTitle(label: 'En retard'),
              for (final task in late)
                _tile(context, ref, task, categories),
            ],
            const _SectionTitle(label: "Aujourd'hui"),
            if (today.isEmpty)
              _EmptyHint(
                icon: Icons.wb_sunny_outlined,
                text: 'Rien de prévu aujourd\'hui',
              )
            else
              for (final task in today) _tile(context, ref, task, categories),
            if (next.isNotEmpty) ...<Widget>[
              const _SectionTitle(label: 'À venir'),
              for (final task in next) _tile(context, ref, task, categories),
            ],
          ],
        ),
      ),
    );
  }

  Widget _tile(
    BuildContext context,
    WidgetRef ref,
    Task task,
    List<Subject> categories,
  ) =>
      TaskTile(
        task: task,
        category: getCategory(categories, task.subjectId),
        onToggle: () => ref.read(tasksProvider.notifier).toggle(task.id),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (_) => TaskDetailScreen(taskId: task.id)),
        ),
        onLongPress: () => _report(context, ref, task),
      );
}

/// Carte de synthèse : trois compteurs.
class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.late, required this.today, required this.next});

  final int late;
  final int today;
  final int next;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 18),
        child: Row(
          children: <Widget>[
            _Counter(value: late, label: 'en retard', color: AppTheme.danger),
            _Counter(value: today, label: "aujourd'hui", color: AppTheme.primary),
            _Counter(value: next, label: 'à venir', color: AppTheme.textSecondary),
          ],
        ),
      ),
    );
  }
}

class _Counter extends StatelessWidget {
  const _Counter({required this.value, required this.label, required this.color});

  final int value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: <Widget>[
          Text(
            '$value',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: color),
          ),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 10),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.4,
          color: AppTheme.textMuted,
        ),
      ),
    );
  }
}

class _EmptyHint extends StatelessWidget {
  const _EmptyHint({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18),
      child: Row(
        children: <Widget>[
          Icon(icon, size: 20, color: AppTheme.textMuted),
          const SizedBox(width: 10),
          Text(text, style: TextStyle(color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}

/// Report d'une tâche, identique à celui de l'accueil.
Future<void> _report(BuildContext context, WidgetRef ref, Task task) async {
  final now = DateTime.now();
  final options = <(String, DateTime)>[
    ('Demain', DateTime(now.year, now.month, now.day + 1, 9)),
    ('Dans 3 jours', addDays(DateTime(now.year, now.month, now.day, 9), 3)),
    ('Dans une semaine', addDays(DateTime(now.year, now.month, now.day, 9), 7)),
  ];

  final choice = await showModalBottomSheet<(String, DateTime)>(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.sheet)),
    ),
    builder: (sheetContext) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          for (final option in options)
            ListTile(
              title: Text(option.$1),
              onTap: () => Navigator.of(sheetContext).pop(option),
            ),
        ],
      ),
    ),
  );

  if (choice != null && context.mounted) {
    await ref.read(tasksProvider.notifier).report(task.id, choice.$2);
  }
}
