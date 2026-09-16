import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';
import '../viewmodels/settings_viewmodel.dart';
import '../viewmodels/tasks_viewmodel.dart';
import '../widgets/task_tile.dart';

/// Archives : tâches terminées puis rangées, restaurables une à une.
///
/// Port de `app/(tabs)/archives.tsx`, également route masquée du bottom nav.
/// Vider les archives est une suppression définitive : elle demande une
/// confirmation, ce que l'application d'origine ne faisait pas.
class ArchivesScreen extends ConsumerWidget {
  /// Écran des archives.
  const ArchivesScreen({super.key});

  Future<void> _clear(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Vider les archives ?'),
        content: const Text(
          'Toutes les tâches archivées seront définitivement supprimées.',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppTheme.danger),
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Vider'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;
    final removed = await ref.read(tasksProvider.notifier).clearArchives();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$removed tâche(s) supprimée(s)')),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(tasksProvider);
    final notifier = ref.read(tasksProvider.notifier);
    final categories = ref.watch(settingsProvider).settings.categories;
    final archived = state.archived;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Archives'),
        actions: <Widget>[
          if (archived.isNotEmpty)
            IconButton(
              tooltip: 'Vider les archives',
              icon: const Icon(Icons.delete_sweep_outlined),
              onPressed: () => _clear(context, ref),
            ),
        ],
      ),
      body: archived.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Icon(Icons.archive_outlined, size: 44, color: AppTheme.textMuted),
                  const SizedBox(height: 14),
                  Text(
                    'Aucune tâche archivée',
                    style: TextStyle(color: AppTheme.textMuted),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.screen,
                8,
                AppSpacing.screen,
                120,
              ),
              itemCount: archived.length,
              itemBuilder: (context, index) {
                final task = archived[index];
                return Stack(
                  children: <Widget>[
                    TaskTile(
                      task: task,
                      category: getCategory(categories, task.subjectId),
                      onToggle: () => notifier.toggle(task.id),
                    ),
                    Positioned(
                      right: 4,
                      bottom: 4,
                      child: TextButton.icon(
                        onPressed: () => notifier.restore(task.id),
                        icon: const Icon(Icons.unarchive_rounded, size: 16),
                        label: const Text('Restaurer'),
                      ),
                    ),
                  ],
                );
              },
            ),
    );
  }
}
