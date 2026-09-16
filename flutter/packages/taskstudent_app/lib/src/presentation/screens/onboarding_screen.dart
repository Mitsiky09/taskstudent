import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:taskstudent_core/taskstudent.dart';

import '../../app/theme.dart';
import '../viewmodels/session_viewmodel.dart';

/// Introduction en trois écrans, port de `app/onboarding/1..3.tsx`.
///
/// Titres et emojis repris de l'application d'origine. La fin marque
/// l'introduction comme vue : la garde de navigation ne la représentera plus,
/// sauf demande explicite depuis le profil.
class OnboardingScreen extends ConsumerStatefulWidget {
  /// Introduction.
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _controller = PageController();
  int _page = 0;

  static const List<(String, String, String)> _slides = <(String, String, String)>[
    ('🧘', 'Organise ta vie sans stress', 'Tes tâches, tes catégories et tes '
        'échéances, réunis dans un seul endroit clair.'),
    ('⚡', 'Ajoute une tâche en quelques secondes', 'Un titre, une échéance, '
        'une catégorie : l\'essentiel, sans formulaire à rallonge.'),
    ('📦', 'Archive tes tâches terminées', 'Ce qui est fait sort de la vue, '
        'mais reste consultable et restaurable.'),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _next() async {
    if (_page == _slides.length - 1) {
      await ref.read(sessionProvider.notifier).completeOnboarding();
      return;
    }
    await _controller.nextPage(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final last = _page == _slides.length - 1;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: <Widget>[
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () async {
                  await ref.read(sessionProvider.notifier).completeOnboarding();
                },
                child: Text(
                  'Passer',
                  style: TextStyle(color: AppTheme.textMuted),
                ),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _slides.length,
                onPageChanged: (value) => setState(() => _page = value),
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: <Widget>[
                        Container(
                          width: 120,
                          height: 120,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceMuted,
                            borderRadius: BorderRadius.circular(AppRadius.panel),
                          ),
                          child: Text(slide.$1, style: const TextStyle(fontSize: 52)),
                        ),
                        const SizedBox(height: 32),
                        Text(
                          slide.$2,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                            height: 1.25,
                            color: AppTheme.text,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          slide.$3,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 15,
                            height: 1.5,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                for (var i = 0; i < _slides.length; i++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: i == _page ? 22 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: i == _page ? AppTheme.primary : AppTheme.border,
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.screen,
                24,
                AppSpacing.screen,
                24,
              ),
              child: FilledButton(
                onPressed: _next,
                child: Text(last ? 'Commencer' : 'Suivant'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
