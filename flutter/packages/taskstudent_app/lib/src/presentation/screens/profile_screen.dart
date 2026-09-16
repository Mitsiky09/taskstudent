import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';
import '../viewmodels/session_viewmodel.dart';
import '../viewmodels/settings_viewmodel.dart';
import '../viewmodels/tasks_viewmodel.dart';
import 'archives_screen.dart';
import 'stats_screen.dart';
import 'tasks_screen.dart';

/// Onglet « Profil » : préférences, catégories, export, session.
///
/// Port de `app/(tabs)/profile.tsx`. Deux différences assumées avec l'application
/// d'origine : l'export passe par le presse-papiers (aucun plugin de partage
/// dans ce port) et la déconnexion demande une confirmation.
class ProfileScreen extends ConsumerWidget {
  /// Onglet « Profil ».
  const ProfileScreen({super.key});

  Future<void> _export(BuildContext context, WidgetRef ref) async {
    final tasks = ref.read(tasksProvider).tasks;
    final format = await showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.sheet)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            ListTile(
              leading: const Icon(Icons.data_object_rounded),
              title: const Text('Exporter en JSON'),
              subtitle: const Text('Rechargeable dans l’application'),
              onTap: () => Navigator.of(sheetContext).pop('json'),
            ),
            ListTile(
              leading: const Icon(Icons.table_view_rounded),
              title: const Text('Exporter en CSV'),
              subtitle: const Text('Ouvrable dans un tableur'),
              onTap: () => Navigator.of(sheetContext).pop('csv'),
            ),
          ],
        ),
      ),
    );

    if (format == null || !context.mounted) return;
    final content = format == 'json' ? toJSON(tasks) : toCSV(tasks);
    await Clipboard.setData(ClipboardData(text: content));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${tasks.length} tâche(s) copiée(s) au format '
            '${format.toUpperCase()}'),
      ),
    );
  }

  Future<void> _signOut(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Se déconnecter ?'),
        content: const Text('Tes tâches restent enregistrées sur cet appareil.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Se déconnecter'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(sessionProvider.notifier).signOut();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final settings = ref.watch(settingsProvider).settings;
    final settingsNotifier = ref.read(settingsProvider.notifier);
    final user = session.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.screen,
          4,
          AppSpacing.screen,
          120,
        ),
        children: <Widget>[
          Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: AppTheme.primary,
                child: Text(
                  user == null || user.name.isEmpty
                      ? '?'
                      : user.name.substring(0, 1).toUpperCase(),
                  style: const TextStyle(color: Colors.white),
                ),
              ),
              title: Text(
                user?.name ?? 'Invité',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                user == null || user.email.isEmpty
                    ? 'Session locale, sur cet appareil'
                    : user.email,
              ),
            ),
          ),
          const _SectionTitle(label: 'Préférences'),
          Card(
            child: Column(
              children: <Widget>[
                SwitchListTile(
                  value: settings.notifications,
                  onChanged: settingsNotifier.setNotifications,
                  title: const Text('Rappels avant échéance'),
                  subtitle: const Text('Nécessite un plugin de notifications'),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  value: settings.autoArchive,
                  onChanged: settingsNotifier.setAutoArchive,
                  title: const Text('Archivage automatique'),
                  subtitle: const Text('Range les tâches terminées après 7 jours'),
                ),
              ],
            ),
          ),
          const _SectionTitle(label: 'Catégories'),
          Card(
            child: Column(
              children: <Widget>[
                for (final category in settings.categories)
                  ListTile(
                    leading: Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: AppTheme.category(category.color),
                        shape: BoxShape.circle,
                      ),
                    ),
                    title: Text(category.name),
                    trailing: PopupMenuButton<String>(
                      onSelected: (value) async {
                        switch (value) {
                          case 'rename':
                            await _rename(context, settingsNotifier, category);
                          case 'delete':
                            await settingsNotifier.deleteCategory(category.id);
                        }
                      },
                      itemBuilder: (menuContext) => const <PopupMenuEntry<String>>[
                        PopupMenuItem<String>(value: 'rename', child: Text('Renommer')),
                        PopupMenuItem<String>(value: 'delete', child: Text('Supprimer')),
                      ],
                    ),
                  ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.add_rounded),
                  title: const Text('Ajouter une catégorie'),
                  onTap: () => _addCategory(context, settingsNotifier),
                ),
              ],
            ),
          ),
          const _SectionTitle(label: 'Données'),
          Card(
            child: Column(
              children: <Widget>[
                ListTile(
                  leading: const Icon(Icons.list_alt_rounded),
                  title: const Text('Toutes les tâches'),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const TasksScreen()),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.archive_outlined),
                  title: const Text('Archives'),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const ArchivesScreen()),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.insights_rounded),
                  title: const Text('Statistiques'),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const StatsScreen()),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.ios_share_rounded),
                  title: const Text('Exporter mes tâches (JSON / CSV)'),
                  onTap: () => _export(context, ref),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.replay_rounded),
                  title: const Text("Revoir l'introduction"),
                  onTap: () => ref.read(sessionProvider.notifier).resetOnboarding(),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: Icon(Icons.logout_rounded, color: AppTheme.danger),
                  title: Text('Déconnexion', style: TextStyle(color: AppTheme.danger)),
                  onTap: () => _signOut(context, ref),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _rename(
    BuildContext context,
    SettingsNotifier notifier,
    Subject category,
  ) async {
    final controller = TextEditingController(text: category.name);
    final name = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Renommer la catégorie'),
        content: TextField(controller: controller, autofocus: true),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(controller.text),
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
    final trimmed = name?.trim() ?? '';
    if (trimmed.isNotEmpty) {
      await notifier.renameCategory(category.id, trimmed);
    }
  }

  Future<void> _addCategory(BuildContext context, SettingsNotifier notifier) async {
    final controller = TextEditingController();
    var color = kCategoryColors.first;

    final name = await showDialog<String>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Nouvelle catégorie'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              TextField(
                controller: controller,
                autofocus: true,
                decoration: const InputDecoration(hintText: 'Nom'),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: <Widget>[
                  for (final option in kCategoryColors)
                    InkWell(
                      onTap: () => setState(() => color = option),
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                      child: Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(
                          color: AppTheme.category(option),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: option == color ? AppTheme.text : Colors.transparent,
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Annuler'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(controller.text),
              child: const Text('Ajouter'),
            ),
          ],
        ),
      ),
    );

    final trimmed = name?.trim() ?? '';
    if (trimmed.isNotEmpty) {
      await notifier.addCategory(trimmed, color);
    }
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 24, bottom: 10),
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
