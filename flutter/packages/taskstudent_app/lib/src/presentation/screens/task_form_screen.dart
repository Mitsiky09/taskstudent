import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';
import '../viewmodels/settings_viewmodel.dart';
import '../viewmodels/tasks_viewmodel.dart';

/// Création et édition complète d'une tâche.
///
/// Le dialogue de l'accueil couvre le cas rapide (titre + catégorie) ; cet écran
/// expose tout ce que le modèle sait stocker et que l'application d'origine
/// laissait de côté : description, durée estimée, répétition et remarque.
/// C'est l'un des manques relevés dans `docs/AMELIORATIONS.md`.
class TaskFormScreen extends ConsumerStatefulWidget {
  /// Formulaire de tâche. Sans [taskId], il crée ; sinon il édite.
  const TaskFormScreen({super.key, this.taskId});

  /// Tâche à éditer, le cas échéant.
  final String? taskId;

  @override
  ConsumerState<TaskFormScreen> createState() => _TaskFormScreenState();
}

class _TaskFormScreenState extends ConsumerState<TaskFormScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  late final TextEditingController _title;
  late final TextEditingController _description;
  late final TextEditingController _note;

  late String _subjectId;
  late Priority _priority;
  late RepeatRule _repeat;
  late DateTime _due;
  int? _duration;

  bool get _isEditing => widget.taskId != null;

  @override
  void initState() {
    super.initState();
    final existing = _isEditing
        ? ref.read(tasksProvider).tasks.where((task) => task.id == widget.taskId)
        : const Iterable<Task>.empty();
    final task = existing.isEmpty ? null : existing.first;
    final categories = ref.read(settingsProvider).settings.categories;

    _title = TextEditingController(text: task?.title ?? '');
    _description = TextEditingController(text: task?.description ?? '');
    _note = TextEditingController(text: task?.note ?? '');
    _subjectId = task?.subjectId ??
        (categories.isNotEmpty ? categories.first.id : kFallbackProject.id);
    _priority = task?.priority ?? Priority.medium;
    _repeat = task?.repeat ?? RepeatRule.none;
    _due = task?.due ?? endOfDay(DateTime.now());
    _duration = task?.durationMinutes;
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _due,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
    );
    if (picked == null) return;
    setState(() {
      _due = isEndOfDay(_due)
          ? endOfDay(picked)
          : DateTime(picked.year, picked.month, picked.day, _due.hour, _due.minute);
    });
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: _due.hour, minute: _due.minute),
    );
    if (picked == null) return;
    setState(() {
      _due = DateTime(_due.year, _due.month, _due.day, picked.hour, picked.minute);
    });
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final notifier = ref.read(tasksProvider.notifier);

    if (_isEditing) {
      await notifier.update(
        widget.taskId!,
        (task) => task.copyWith(
          title: _title.text.trim(),
          description: _description.text.trim(),
          subjectId: _subjectId,
          priority: _priority,
          dueDate: _due,
          durationMinutes: _duration,
          clearDurationMinutes: _duration == null,
          note: _note.text.trim(),
          repeat: _repeat,
        ),
      );
    } else {
      await notifier.create(
        TaskInput(
          title: _title.text.trim(),
          description: _description.text.trim(),
          dueDate: _due,
          priority: _priority,
          subjectId: _subjectId,
          durationMinutes: _duration,
          note: _note.text.trim(),
          repeat: _repeat,
        ),
      );
    }

    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(settingsProvider).settings.categories;

    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Modifier' : 'Nouvelle tâche')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.screen,
            8,
            AppSpacing.screen,
            40,
          ),
          children: <Widget>[
            TextFormField(
              controller: _title,
              autofocus: !_isEditing,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Titre'),
              validator: (value) =>
                  (value == null || value.trim().isEmpty) ? 'Donne un titre' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _description,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'Description'),
            ),
            const SizedBox(height: 20),
            DropdownButtonFormField<String>(
              value: _subjectId,
              decoration: const InputDecoration(labelText: 'Catégorie'),
              items: <DropdownMenuItem<String>>[
                for (final category in categories)
                  DropdownMenuItem<String>(
                    value: category.id,
                    child: Text(category.name),
                  ),
              ],
              onChanged: (value) => setState(() => _subjectId = value ?? _subjectId),
            ),
            const SizedBox(height: 20),
            const _FieldLabel(label: 'Priorité'),
            SegmentedButton<Priority>(
              segments: <ButtonSegment<Priority>>[
                for (final priority in Priority.values)
                  ButtonSegment<Priority>(
                    value: priority,
                    label: Text(kPriorityLabels[priority] ?? priority.wire),
                  ),
              ],
              selected: <Priority>{_priority},
              onSelectionChanged: (selection) =>
                  setState(() => _priority = selection.first),
            ),
            const SizedBox(height: 20),
            const _FieldLabel(label: 'Échéance'),
            Row(
              children: <Widget>[
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.calendar_today_rounded, size: 18),
                    label: Text(formatShortDateWithYear(_due)),
                    onPressed: _pickDate,
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  icon: const Icon(Icons.schedule_rounded, size: 18),
                  label: Text(isEndOfDay(_due) ? '—' : formatTime(_due)),
                  onPressed: _pickTime,
                ),
              ],
            ),
            const SizedBox(height: 20),
            DropdownButtonFormField<RepeatRule>(
              value: _repeat,
              decoration: const InputDecoration(labelText: 'Répétition'),
              items: <DropdownMenuItem<RepeatRule>>[
                for (final option in kRepeatOptions)
                  DropdownMenuItem<RepeatRule>(
                    value: option.$1,
                    child: Text(option.$2),
                  ),
              ],
              onChanged: (value) => setState(() => _repeat = value ?? RepeatRule.none),
            ),
            const SizedBox(height: 20),
            const _FieldLabel(label: 'Durée estimée'),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                ChoiceChip(
                  label: const Text('Aucune'),
                  selected: _duration == null,
                  onSelected: (_) => setState(() => _duration = null),
                ),
                for (final minutes in kDurationOptions)
                  ChoiceChip(
                    label: Text('$minutes min'),
                    selected: _duration == minutes,
                    onSelected: (_) => setState(() => _duration = minutes),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            TextFormField(
              controller: _note,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(labelText: 'Remarque'),
            ),
            const SizedBox(height: 28),
            FilledButton(
              onPressed: _submit,
              child: Text(_isEditing ? 'Enregistrer' : 'Ajouter la tâche'),
            ),
          ],
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
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
