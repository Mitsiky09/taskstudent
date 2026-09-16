import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';
import '../viewmodels/settings_viewmodel.dart';
import '../viewmodels/tasks_viewmodel.dart';

/// Détail d'une tâche : sous-tâches, report, archivage, suppression.
class TaskDetailScreen extends ConsumerStatefulWidget {
  /// Détail d'une tâche, identifiée par son identifiant.
  const TaskDetailScreen({super.key, required this.taskId});

  /// Identifiant de la tâche affichée.
  final String taskId;

  @override
  ConsumerState<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends ConsumerState<TaskDetailScreen> {
  final TextEditingController _subtaskController = TextEditingController();

  @override
  void dispose() {
    _subtaskController.dispose();
    super.dispose();
  }

  Future<void> _confirmDelete(Task task) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Supprimer la tâche ?'),
        content: Text('« ${task.title} » sera définitivement supprimée.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppTheme.danger),
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await ref.read(tasksProvider.notifier).delete(task.id);
      if (mounted) Navigator.of(context).pop();
    }
  }

  Future<void> _addSubtask() async {
    final title = _subtaskController.text.trim();
    if (title.isEmpty) return;
    await ref.read(tasksProvider.notifier).addSubtask(widget.taskId, title);
    _subtaskController.clear();
  }

  @override
  Widget build(BuildContext context) {
    final tasks = ref.watch(tasksProvider).tasks;
    final index = tasks.indexWhere((task) => task.id == widget.taskId);

    if (index < 0) {
      return Scaffold(
        appBar: AppBar(title: const Text('Tâche')),
        body: const Center(child: Text('Tâche introuvable')),
      );
    }

    final task = tasks[index];
    final categories = ref.watch(settingsProvider).settings.categories;
    final category = getCategory(categories, task.subjectId);
    final notifier = ref.read(tasksProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Détail'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Supprimer',
            icon: const Icon(Icons.delete_outline_rounded),
            onPressed: () => _confirmDelete(task),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.screen,
          8,
          AppSpacing.screen,
          40,
        ),
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Checkbox(
                value: task.status == TaskStatus.completed,
                onChanged: (_) => notifier.toggle(task.id),
              ),
              Expanded(
                child: Text(
                  task.title,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                    color: AppTheme.text,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              _InfoChip(
                icon: Icons.folder_rounded,
                label: category.name,
                color: AppTheme.category(category.color),
              ),
              _InfoChip(
                icon: Icons.schedule_rounded,
                label: formatDueLabel(task.due),
                color: isOverdue(task) ? AppTheme.danger : AppTheme.textSecondary,
              ),
              _InfoChip(
                icon: Icons.flag_rounded,
                label: kPriorityLabels[task.priority] ?? '',
                color: colorFromHex(
                  kPriorityColors[task.priority] ?? AppColors.textMuted,
                ),
              ),
              if (task.repeat != RepeatRule.none)
                _InfoChip(
                  icon: Icons.repeat_rounded,
                  label: repeatLabel(task.repeat),
                  color: AppTheme.textSecondary,
                ),
              if (task.durationMinutes != null)
                _InfoChip(
                  icon: Icons.timer_outlined,
                  label: '${task.durationMinutes} min',
                  color: AppTheme.textSecondary,
                ),
            ],
          ),
          if (task.description.isNotEmpty) ...<Widget>[
            const SizedBox(height: 20),
            _SectionTitle(label: 'Description'),
            Text(task.description, style: TextStyle(color: AppTheme.textSecondary)),
          ],
          const SizedBox(height: 24),
          _SectionTitle(label: 'Sous-tâches'),
          if (task.subtasks.isEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                'Aucune sous-tâche',
                style: TextStyle(color: AppTheme.textMuted),
              ),
            ),
          for (final subtask in task.subtasks)
            CheckboxListTile(
              value: subtask.isCompleted,
              onChanged: (_) => notifier.toggleSubtask(task.id, subtask.id),
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: EdgeInsets.zero,
              title: Text(
                subtask.title,
                style: TextStyle(
                  decoration:
                      subtask.isCompleted ? TextDecoration.lineThrough : null,
                  color: subtask.isCompleted ? AppTheme.textMuted : AppTheme.text,
                ),
              ),
            ),
          Row(
            children: <Widget>[
              Expanded(
                child: TextField(
                  controller: _subtaskController,
                  decoration: const InputDecoration(hintText: 'Ajouter une sous-tâche'),
                  onSubmitted: (_) => _addSubtask(),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add_circle_outline_rounded),
                onPressed: _addSubtask,
              ),
            ],
          ),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            icon: const Icon(Icons.snooze_rounded),
            label: const Text('Reporter à demain'),
            onPressed: () async {
              final now = DateTime.now();
              await notifier.report(
                task.id,
                DateTime(now.year, now.month, now.day + 1, 9),
              );
            },
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            icon: const Icon(Icons.archive_outlined),
            label: Text(
              task.status == TaskStatus.archived ? 'Restaurer' : 'Archiver',
            ),
            onPressed: () async {
              if (task.status == TaskStatus.archived) {
                await notifier.restore(task.id);
              } else {
                await notifier.archive(task.id);
                if (mounted) Navigator.of(context).pop();
              }
            },
          ),
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
      padding: const EdgeInsets.only(bottom: 8),
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

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label, required this.color});

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMuted,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: color),
          ),
        ],
      ),
    );
  }
}
