import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';
import '../viewmodels/settings_viewmodel.dart';
import '../viewmodels/tasks_viewmodel.dart';
import '../widgets/task_tile.dart';
import 'task_detail_screen.dart';

/// Onglet « Agenda » : vue mensuelle et détail du jour sélectionné.
///
/// Port de `app/(tabs)/calendar.tsx`. La grille est construite à la main avec
/// les utilitaires du noyau ([startOfMonth], [eachDay], [tasksDueOn]) plutôt
/// qu'avec un paquet de calendrier : moins de dépendances, et la logique de
/// sélection reste lisible.
class CalendarScreen extends ConsumerStatefulWidget {
  /// Onglet « Agenda ».
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  String _selected = toDateKey(DateTime.now());

  void _shiftMonth(int delta) {
    setState(() {
      _month = DateTime(_month.year, _month.month + delta);
    });
  }

  @override
  Widget build(BuildContext context) {
    final tasks = ref.watch(tasksProvider).tasks;
    final categories = ref.watch(settingsProvider).settings.categories;
    final monthDays = eachDay(startOfMonth(_month), endOfMonth(_month));
    final dayTasks = sortTasks(tasksDueOn(tasks, _selected), TaskSort.date);

    return Scaffold(
      appBar: AppBar(title: const Text('Agenda')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.screen,
          4,
          AppSpacing.screen,
          120,
        ),
        children: <Widget>[
          _MonthHeader(
            label: monthLabel(_month),
            onPrevious: () => _shiftMonth(-1),
            onNext: () => _shiftMonth(1),
          ),
          const _WeekdayRow(),
          _MonthGrid(
            month: _month,
            days: monthDays,
            selected: _selected,
            tasks: tasks,
            onSelected: (dateKey) => setState(() => _selected = dateKey),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 24, bottom: 10),
            child: Text(
              formatDay(fromDateKey(_selected)),
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.4,
                color: AppTheme.textMuted,
              ),
            ),
          ),
          if (dayTasks.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  'Aucune tâche ce jour',
                  style: TextStyle(color: AppTheme.textMuted),
                ),
              ),
            )
          else
            for (final task in dayTasks)
              TaskTile(
                task: task,
                category: getCategory(categories, task.subjectId),
                onToggle: () => ref.read(tasksProvider.notifier).toggle(task.id),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => TaskDetailScreen(taskId: task.id),
                  ),
                ),
              ),
        ],
      ),
    );
  }
}

/// Libellé du mois, en minuscules comme le reste de l'application.
String monthLabel(DateTime month) {
  final name = kMonthsLong[month.month - 1];
  return '${name[0].toUpperCase()}${name.substring(1)} ${month.year}';
}

class _MonthHeader extends StatelessWidget {
  const _MonthHeader({
    required this.label,
    required this.onPrevious,
    required this.onNext,
  });

  final String label;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Text(
          label,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.text),
        ),
        const Spacer(),
        IconButton(
          onPressed: onPrevious,
          icon: const Icon(Icons.chevron_left_rounded),
        ),
        IconButton(onPressed: onNext, icon: const Icon(Icons.chevron_right_rounded)),
      ],
    );
  }
}

class _WeekdayRow extends StatelessWidget {
  const _WeekdayRow();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        // kWeekdaysShort est indexé dimanche = 0 ; la grille commence le lundi.
        for (final label in const <String>['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'])
          Expanded(
            child: Center(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textMuted,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _MonthGrid extends StatelessWidget {
  const _MonthGrid({
    required this.month,
    required this.days,
    required this.selected,
    required this.tasks,
    required this.onSelected,
  });

  final DateTime month;
  final List<DateTime> days;
  final String selected;
  final List<Task> tasks;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    // Décalage pour que le 1er tombe sous la bonne colonne (lundi = 0).
    final leading = (startOfMonth(month).weekday - 1) % 7;

    return GridView.count(
      crossAxisCount: 7,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 0.85,
      crossAxisSpacing: 2,
      mainAxisSpacing: 2,
      children: <Widget>[
        for (var i = 0; i < leading; i++) const SizedBox.shrink(),
        for (final day in days)
          _DayCell(
            day: day,
            dateKey: toDateKey(day),
            selected: toDateKey(day) == selected,
            isToday: isSameDay(day, now),
            hasTasks: tasksDueOn(tasks, toDateKey(day)).isNotEmpty,
            onTap: () => onSelected(toDateKey(day)),
          ),
      ],
    );
  }
}

class _DayCell extends StatelessWidget {
  const _DayCell({
    required this.day,
    required this.dateKey,
    required this.selected,
    required this.isToday,
    required this.hasTasks,
    required this.onTap,
  });

  final DateTime day;
  final String dateKey;
  final bool selected;
  final bool isToday;
  final bool hasTasks;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.control),
      child: Container(
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(AppRadius.control),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(
              '${day.day}',
              style: TextStyle(
                fontSize: 14,
                fontWeight: isToday ? FontWeight.w700 : FontWeight.w500,
                color: selected
                    ? Colors.white
                    : isToday
                        ? AppTheme.primary
                        : AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 3),
            Container(
              width: 5,
              height: 5,
              decoration: BoxDecoration(
                color: hasTasks
                    ? selected
                        ? Colors.white
                        : AppTheme.primary
                    : Colors.transparent,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
