import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';
import '../viewmodels/settings_viewmodel.dart';
import '../viewmodels/tasks_viewmodel.dart';

/// Statistiques : semaine en cours, tendance sur 14 jours, répartition.
///
/// Tous les calculs viennent du noyau ([statsForRange], [completedPerDay],
/// [computeStats]) : l'écran ne fait que mettre en forme.
class StatsScreen extends ConsumerWidget {
  /// Écran de statistiques.
  const StatsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(tasksProvider);
    final categories = ref.watch(settingsProvider).settings.categories;
    final now = DateTime.now();
    final week = statsForRange(state.tasks, startOfWeek(now), now, now);
    final trend = completedPerDay(state.tasks, addDays(now, -13), now);
    final global = state.stats;

    return Scaffold(
      appBar: AppBar(title: const Text('Statistiques')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.screen,
          8,
          AppSpacing.screen,
          40,
        ),
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: _StatCard(
                  label: 'Cette semaine',
                  value: '${week.completed}/${week.totalDue}',
                  hint: 'tâches terminées',
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  label: 'En retard',
                  value: '${global.overdue}',
                  hint: 'à rattraper',
                  color: AppTheme.danger,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: <Widget>[
              Expanded(
                child: _StatCard(
                  label: 'Total',
                  value: '${global.total}',
                  hint: 'tâches enregistrées',
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  label: 'Complétion',
                  value: '${global.completionRate}%',
                  hint: 'depuis le début',
                  color: AppTheme.success,
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          const _SectionTitle(label: '14 derniers jours'),
          _TrendChart(points: trend),
          const SizedBox(height: 32),
          const _SectionTitle(label: 'Par catégorie'),
          for (final entry in global.bySubject)
            _CategoryRow(
              name: getCategory(categories, entry.subjectId).name,
              color: AppTheme.category(getCategory(categories, entry.subjectId).color),
              completed: entry.completed,
              total: entry.total,
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
      padding: const EdgeInsets.only(bottom: 12),
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

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.hint,
    required this.color,
  });

  final String label;
  final String value;
  final String hint;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(label, style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: color),
            ),
            const SizedBox(height: 2),
            Text(hint, style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
          ],
        ),
      ),
    );
  }
}

/// Histogramme minimal, sans dépendance de graphique.
class _TrendChart extends StatelessWidget {
  const _TrendChart({required this.points});

  final List<DailyCount> points;

  @override
  Widget build(BuildContext context) {
    final max = points.fold<int>(0, (value, point) => point.count > value ? point.count : value);
    return SizedBox(
      height: 120,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: <Widget>[
          for (final point in points)
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: <Widget>[
                  Container(
                    height: max == 0 ? 2 : 4 + (point.count / max) * 90,
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                      color: point.count == 0 ? AppTheme.surfaceMuted : AppTheme.primary,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    point.label.split(' ').last,
                    style: TextStyle(fontSize: 9, color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _CategoryRow extends StatelessWidget {
  const _CategoryRow({
    required this.name,
    required this.color,
    required this.completed,
    required this.total,
  });

  final String name;
  final Color color;
  final int completed;
  final int total;

  @override
  Widget build(BuildContext context) {
    final ratio = total == 0 ? 0.0 : completed / total;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  name,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.text),
                ),
              ),
              Text(
                '$completed/$total',
                style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.pill),
            child: LinearProgressIndicator(
              value: ratio,
              minHeight: 6,
              backgroundColor: AppTheme.surfaceMuted,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }
}
