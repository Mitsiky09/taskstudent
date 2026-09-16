import 'package:flutter/material.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';

/// Carte de tâche.
///
/// Reprend la hiérarchie en deux lignes de l'application Expo, délibérément
/// sobre : aucune pastille « En retard » / « Reporté », pas de durée, pas
/// d'action permanente. L'état se lit dans la couleur de l'échéance, les
/// actions passent par le tap et l'appui long.
///
/// Widget purement présentationnel : il ne connaît ni Riverpod ni Hive, il
/// reçoit des données et des rappels.
class TaskTile extends StatelessWidget {
  /// Carte de tâche.
  const TaskTile({
    super.key,
    required this.task,
    required this.category,
    this.onToggle,
    this.onTap,
    this.onLongPress,
  });

  /// Tâche affichée.
  final Task task;

  /// Catégorie résolue (jamais `null` : le noyau retombe sur la boîte de
  /// réception si l'identifiant est inconnu).
  final Subject category;

  /// Appel quand la case est cochée ou décochée.
  final VoidCallback? onToggle;

  /// Appel sur un tap simple.
  final VoidCallback? onTap;

  /// Appel sur un appui long : ouvre le report.
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    final completed = task.status == TaskStatus.completed;
    final overdue = isOverdue(task);
    final reported = isReported(task);
    final color = category.color;
    final done = task.subtasks.where((subtask) => subtask.isCompleted).length;

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.item),
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(AppRadius.card),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _CheckBox(checked: completed, onTap: onToggle),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            task.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              height: 1.3,
                              color: completed ? AppTheme.textMuted : AppTheme.text,
                              decoration: completed ? TextDecoration.lineThrough : null,
                              decorationColor: AppTheme.textMuted,
                            ),
                          ),
                        ),
                        if (task.priority == Priority.high && !completed)
                          Padding(
                            padding: const EdgeInsets.only(left: 8, top: 5),
                            child: _Dot(color: AppTheme.danger, size: 8),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: <Widget>[
                        _Dot(color: AppTheme.category(color), size: 8),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            category.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 6),
                          child: Text('·', style: TextStyle(color: AppTheme.textMuted)),
                        ),
                        Text(
                          formatDueLabel(task.due),
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: overdue || reported ? FontWeight.w600 : FontWeight.w500,
                            color: completed
                                ? AppTheme.textMuted
                                : overdue
                                    ? AppTheme.danger
                                    : reported
                                        ? AppTheme.warning
                                        : AppTheme.textSecondary,
                          ),
                        ),
                        const Spacer(),
                        if (task.repeat != RepeatRule.none)
                          Icon(Icons.repeat_rounded, size: 15, color: AppTheme.textMuted),
                        if (task.subtasks.isNotEmpty) ...<Widget>[
                          const SizedBox(width: 6),
                          Icon(
                            Icons.checklist_rounded,
                            size: 15,
                            color: AppTheme.textMuted,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            '$done/${task.subtasks.length}',
                            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CheckBox extends StatelessWidget {
  const _CheckBox({required this.checked, this.onTap});

  final bool checked;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 2),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: checked ? AppTheme.success : Colors.transparent,
            borderRadius: BorderRadius.circular(7),
            border: Border.all(
              color: checked ? AppTheme.success : AppTheme.border,
              width: 1.6,
            ),
          ),
          child: checked
              ? const Icon(Icons.check_rounded, size: 15, color: Colors.white)
              : null,
        ),
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  const _Dot({required this.color, required this.size});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}
