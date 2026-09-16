import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';
import '../providers.dart';
import '../viewmodels/settings_viewmodel.dart';
import '../viewmodels/tasks_viewmodel.dart';
import '../widgets/quick_add_bar.dart';
import '../widgets/task_tile.dart';
import 'stats_screen.dart';
import 'task_detail_screen.dart';

/// Onglet « Accueil » : tâches groupées par jour d'échéance.
///
/// La Vue ne calcule rien : filtres, tri, regroupement et libellés viennent du
/// ViewModel ([TasksNotifier]) et du noyau. Le bouton d'ajout appartient à la
/// coque à onglets, pas à cet écran.
class AgendaScreen extends ConsumerWidget {
  /// Accueil.
  const AgendaScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksState = ref.watch(tasksProvider);
    final categories = ref.watch(settingsProvider).settings.categories;
    final sections = tasksState.sections(categories);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Agenda'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Statistiques',
            icon: const Icon(Icons.insights_rounded),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(builder: (_) => const StatsScreen()),
            ),
          ),
        ],
      ),
      body: Column(
        children: <Widget>[
          const QuickAddBar(),
          _FilterBar(
            filter: tasksState.filter,
            onChanged: ref.read(tasksProvider.notifier).setFilter,
          ),
          Expanded(
            child: tasksState.isLoading
                ? const Center(child: CircularProgressIndicator())
                : sections.isEmpty
                    ? const _EmptyState()
                    : RefreshIndicator(
                        onRefresh: ref.read(tasksProvider.notifier).refresh,
                        child: ListView(
                          padding: const EdgeInsets.fromLTRB(
                            AppSpacing.screen,
                            4,
                            AppSpacing.screen,
                            120,
                          ),
                          children: <Widget>[
                            for (final section in sections) ...<Widget>[
                              _SectionHeader(label: section.label),
                              for (final task in section.tasks)
                                TaskTile(
                                  task: task,
                                  category: getCategory(categories, task.subjectId),
                                  onToggle: () =>
                                      ref.read(tasksProvider.notifier).toggle(task.id),
                                  onTap: () => Navigator.of(context).push(
                                    MaterialPageRoute<void>(
                                      builder: (_) => TaskDetailScreen(taskId: task.id),
                                    ),
                                  ),
                                  onLongPress: () => _reportSheet(context, ref, task),
                                ),
                            ],
                          ],
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

/// Barre de filtres, alignée sur les libellés de l'application d'origine.
class _FilterBar extends StatelessWidget {
  const _FilterBar({required this.filter, required this.onChanged});

  final TaskFilter filter;
  final ValueChanged<TaskFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 46,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
        children: <Widget>[
          for (final value in TaskFilter.values)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(value.label),
                selected: filter == value,
                onSelected: (_) => onChanged(value),
              ),
            ),
        ],
      ),
    );
  }
}

/// En-tête de section (« Aujourd'hui », « Demain », sinon la date longue).
class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 18, bottom: 10),
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

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return ListView(
      // ListView pour que le RefreshIndicator ne soit pas le seul défilement.
      children: <Widget>[
        const SizedBox(height: 120),
        Icon(Icons.task_alt_rounded, size: 48, color: AppTheme.textMuted),
        const SizedBox(height: 16),
        Center(
          child: Text(
            'Rien à faire ici',
            style: TextStyle(fontSize: 16, color: AppTheme.textSecondary),
          ),
        ),
        const SizedBox(height: 6),
        Center(
          child: Text(
            'Ajoute une tâche avec le bouton +',
            style: TextStyle(fontSize: 14, color: AppTheme.textMuted),
          ),
        ),
      ],
    );
  }
}

/// Report d'une tâche : demain, dans trois jours, dans une semaine.
Future<void> _reportSheet(BuildContext context, WidgetRef ref, Task task) async {
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

