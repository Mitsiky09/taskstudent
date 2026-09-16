import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';
import '../providers.dart';
import '../viewmodels/settings_viewmodel.dart';
import '../viewmodels/tasks_viewmodel.dart';
import '../widgets/task_tile.dart';
import 'stats_screen.dart';
import 'task_detail_screen.dart';

/// Écran d'accueil : liste des tâches groupées par jour d'échéance.
///
/// La Vue ne calcule rien : filtres, tri, regroupement et libellés viennent du
/// ViewModel ([TasksNotifier]) et du noyau.
class HomeScreen extends ConsumerWidget {
  /// Accueil.
  const HomeScreen({super.key});

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
      floatingActionButton: FloatingActionButton(
        onPressed: () => _addTaskDialog(context, ref),
        child: const Icon(Icons.add_rounded),
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

/// Création rapide : titre + échéance du jour à 23 h 59.
///
/// Écran de création complet à venir ; ce dialogue couvre le cas le plus
/// fréquent et exerce déjà tout le chemin Vue → ViewModel → noyau → Hive.
Future<void> _addTaskDialog(BuildContext context, WidgetRef ref) async {
  final categories = ref.read(settingsProvider).settings.categories;
  await showDialog<void>(
    context: context,
    builder: (dialogContext) => _AddTaskDialog(categories: categories),
  );
}

class _AddTaskDialog extends ConsumerStatefulWidget {
  const _AddTaskDialog({required this.categories});

  final List<Subject> categories;

  @override
  ConsumerState<_AddTaskDialog> createState() => _AddTaskDialogState();
}

class _AddTaskDialogState extends ConsumerState<_AddTaskDialog> {
  final TextEditingController _controller = TextEditingController();
  late String _subjectId = widget.categories.isNotEmpty
      ? widget.categories.first.id
      : kFallbackProject.id;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final title = _controller.text.trim();
    if (title.isEmpty) return;
    final now = DateTime.now();
    await ref.read(tasksProvider.notifier).create(
          TaskInput(
            title: title,
            dueDate: endOfDay(now),
            subjectId: _subjectId,
          ),
        );
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Nouvelle tâche'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          TextField(
            controller: _controller,
            autofocus: true,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(hintText: 'Que dois-tu faire ?'),
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _subjectId,
            decoration: const InputDecoration(labelText: 'Catégorie'),
            items: <DropdownMenuItem<String>>[
              for (final category in widget.categories)
                DropdownMenuItem<String>(value: category.id, child: Text(category.name)),
            ],
            onChanged: (value) => setState(() => _subjectId = value ?? _subjectId),
          ),
        ],
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Annuler'),
        ),
        FilledButton(onPressed: _submit, child: const Text('Ajouter')),
      ],
    );
  }
}
