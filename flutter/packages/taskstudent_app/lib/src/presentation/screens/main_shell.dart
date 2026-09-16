import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'agenda_screen.dart';
import 'calendar_screen.dart';
import 'profile_screen.dart';
import 'task_form_screen.dart';
import 'today_screen.dart';

/// Coque à onglets : quatre onglets et un bouton d'ajout central.
///
/// Reprend la structure du bottom nav de l'application Expo — capsule, quatre
/// onglets, bouton d'ajout séparé — que tu avais validée telle quelle. Seule la
/// réalisation change : `NavigationBar` Material 3 à la place de la barre
/// maison.
///
/// [IndexedStack] conserve l'état de chaque onglet (position de défilement,
/// mois affiché dans l'agenda) quand on passe de l'un à l'autre.
class MainShell extends ConsumerStatefulWidget {
  /// Coque à onglets.
  const MainShell({super.key});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  int _index = 0;

  static const List<Widget> _tabs = <Widget>[
    AgendaScreen(),
    TodayScreen(),
    CalendarScreen(),
    ProfileScreen(),
  ];

  Future<void> _newTask() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const TaskFormScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      floatingActionButton: FloatingActionButton(
        onPressed: _newTask,
        tooltip: 'Nouvelle tâche',
        child: const Icon(Icons.add_rounded),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const <NavigationDestination>[
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Accueil',
          ),
          NavigationDestination(
            icon: Icon(Icons.today_outlined),
            selectedIcon: Icon(Icons.today_rounded),
            label: "Aujourd'hui",
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month_rounded),
            label: 'Agenda',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
