import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';
import '../viewmodels/settings_viewmodel.dart';
import '../viewmodels/tasks_viewmodel.dart';
import '../widgets/task_tile.dart';
import 'task_detail_screen.dart';

/// Toutes les tâches : recherche, tri et filtres sur une liste plate.
///
/// Port de `app/(tabs)/tasks.tsx`, qui était une route masquée du bottom nav :
/// on y accède depuis l'accueil et le profil. Contrairement à l'accueil, la
/// liste n'est pas groupée par jour — c'est l'écran de recherche.
class TasksScreen extends ConsumerStatefulWidget {
  /// Liste complète des tâches.
  const TasksScreen({super.key});

  @override
  ConsumerState<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends ConsumerState<TasksScreen> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tasksProvider);
    final notifier = ref.read(tasksProvider.notifier);
    final categories = ref.watch(settingsProvider).settings.categories;
    final tasks = state.visible(categories);

    return Scaffold(
      appBar: AppBar(title: const Text('Tâches')),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.screen,
              0,
              AppSpacing.screen,
              8,
            ),
            child: TextField(
              controller: _search,
              onChanged: notifier.setQuery,
              decoration: InputDecoration(
                hintText: 'Rechercher une tâche, une catégorie…',
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: state.query.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () {
                          _search.clear();
                          notifier.setQuery('');
                        },
                      ),
              ),
            ),
          ),
          Row(
            children: <Widget>[
              const SizedBox(width: AppSpacing.screen),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: <Widget>[
                      for (final value in TaskFilter.values)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(value.label),
                            selected: state.filter == value,
                            onSelected: (_) => notifier.setFilter(value),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              IconButton(
                tooltip: state.sort == TaskSort.date
                    ? 'Trier par priorité'
                    : 'Trier par échéance',
                icon: Icon(
                  state.sort == TaskSort.date
                      ? Icons.schedule_rounded
                      : Icons.flag_rounded,
                ),
                onPressed: () => notifier.setSort(
                  state.sort == TaskSort.date ? TaskSort.priority : TaskSort.date,
                ),
              ),
            ],
          ),
          Expanded(
            child: tasks.isEmpty
                ? Center(
                    child: Text(
                      state.query.isEmpty ? 'Aucune tâche' : 'Aucun résultat',
                      style: TextStyle(color: AppTheme.textMuted),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.screen,
                      8,
                      AppSpacing.screen,
                      120,
                    ),
                    itemCount: tasks.length,
                    itemBuilder: (context, index) {
                      final task = tasks[index];
                      return TaskTile(
                        task: task,
                        category: getCategory(categories, task.subjectId),
                        onToggle: () => notifier.toggle(task.id),
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => TaskDetailScreen(taskId: task.id),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
