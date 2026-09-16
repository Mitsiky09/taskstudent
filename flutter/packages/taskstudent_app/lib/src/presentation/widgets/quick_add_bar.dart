import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';
import '../viewmodels/settings_viewmodel.dart';
import '../viewmodels/tasks_viewmodel.dart';

/// Champ de saisie rapide, port de `components/QuickAdd.tsx`.
///
/// On tape une phrase, les pastilles apparaissent en direct, Entrée crée la
/// tâche. Tout le parsing vient du noyau ([parseQuickAdd]) : ce widget ne
/// reconnaît aucune date lui-même.
class QuickAddBar extends ConsumerStatefulWidget {
  /// Barre de saisie rapide.
  const QuickAddBar({super.key});

  @override
  ConsumerState<QuickAddBar> createState() => _QuickAddBarState();
}

class _QuickAddBarState extends ConsumerState<QuickAddBar> {
  final TextEditingController _controller = TextEditingController();
  ParsedQuickAdd _parsed = const ParsedQuickAdd(
    title: '',
    description: '',
    due: null,
    priority: Priority.medium,
    priorityToken: false,
    subject: null,
    subjectToken: false,
    unknownTokens: <String>[],
    chips: <QuickChip>[],
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    final categories = ref.read(settingsProvider).settings.categories;
    setState(() {
      _parsed = parseQuickAdd(
        value,
        subjects: categories
            .map((category) => QuickSubject(id: category.id, name: category.name))
            .toList(growable: false),
      );
    });
  }

  Future<void> _submit() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    final categories = ref.read(settingsProvider).settings.categories;
    final created = await ref.read(tasksProvider.notifier).createFromQuickAdd(
          text,
          categories: categories,
        );
    if (created == null || !mounted) return;
    _controller.clear();
    setState(() => _parsed = _empty);
    FocusScope.of(context).unfocus();
  }

  static final ParsedQuickAdd _empty = parseQuickAdd('');

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.screen,
        4,
        AppSpacing.screen,
        8,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          TextField(
            controller: _controller,
            onChanged: _onChanged,
            onSubmitted: (_) => _submit(),
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              hintText: 'Ajouter… « demain à 14h #Travail p1 »',
              suffixIcon: IconButton(
                icon: const Icon(Icons.arrow_upward_rounded),
                onPressed: _submit,
              ),
            ),
          ),
          if (_parsed.chips.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Wrap(
                spacing: 6,
                runSpacing: 6,
                children: <Widget>[
                  for (final chip in _parsed.chips) _chip(chip),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _chip(QuickChip chip) {
    final color = switch (chip.kind) {
      QuickChipKind.date => AppTheme.primary,
      QuickChipKind.priority => AppTheme.danger,
      QuickChipKind.subject => chip.unknown ? AppTheme.textMuted : AppTheme.success,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMuted,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(_iconOf(chip.kind), size: 13, color: color),
          const SizedBox(width: 5),
          Text(
            chip.label,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color),
          ),
        ],
      ),
    );
  }

  IconData _iconOf(QuickChipKind kind) => switch (kind) {
        QuickChipKind.date => Icons.schedule_rounded,
        QuickChipKind.priority => Icons.flag_rounded,
        QuickChipKind.subject => Icons.folder_rounded,
      };
}
