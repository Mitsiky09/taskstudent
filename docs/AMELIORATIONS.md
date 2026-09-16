# Améliorations proposées — gestion des tâches

Chaque constat renvoie au code vérifié, pas à une intuition. Les efforts sont
indicatifs : **S** = moins d'une heure, **M** = une demi-journée, **L** = un
chantier.

---

## Priorité 1 — incohérences du modèle (faible effort, effet immédiat)

### 1.1 Trois priorités étiquetées P1, P3, P4

**Constat.** `constants/index.ts` déclare `low: 'P4'`, `medium: 'P3'`,
`high: 'P1'`. Il n'existe pas de P2 : l'échelle Todoist en compte quatre,
l'application n'en expose que trois. Un utilisateur qui lit « P3 » cherche le
P2 qui manque.

**Proposition.** Soit des libellés pleins (« Haute », « Moyenne », « Basse »),
soit P1/P2/P3. Le premier choix est plus lisible pour un public étudiant. **S**

### 1.2 Le rappel n'est pas resynchronisé quand l'échéance change

**Constat.** `scheduleReminder` n'est appelé qu'à la création
(`context/TasksContext.tsx`, dans `createTask`). `updateTask` se contente de
patcher l'objet : repousser une tâche de trois jours laisse la notification
programmée à l'ancienne heure, et la notification d'une tâche supprimée n'est
jamais annulée.

**Proposition.** Dans `updateTask`, si `dueDate` change : annuler les
notifications de la tâche puis reprogrammer. Idem dans `deleteTask` et
`archiveTask`. Le modèle `reminders: string[]` est déjà là. **S**

### 1.3 La recherche ignore les remarques

**Constat.** `searchTasks` (`lib/tasks.ts`) concatène `title`, `description` et
le nom de catégorie — mais pas `note`, alors que l'écran de détail invite
justement à y écrire des remarques.

**Proposition.** Ajouter `t.note` à la chaîne cherchée, avec un test. **S**

### 1.4 L'ajout rapide ne profite pas du modèle

**Constat.** `app/task/new.tsx` crée systématiquement `priority: 'medium'`,
`reminders: []`, `description: ''`, `durationMinutes: null`, `repeat: 'none'`.
La priorité, la durée, la répétition et le rappel ne sont accessibles qu'en
rouvrant la tâche — alors que `QuickAdd.tsx` (composant non branché) les
propose déjà.

**Proposition.** Ajouter dans la barre du bas de la feuille : priorité
(drapeau), et programmer le rappel en respectant `settings.notifications`
(comme le fait `QuickAdd`). **M**

---

## Priorité 2 — fluidité au quotidien

### 2.1 Gestes sur la carte

Glisser à droite = terminer, glisser à gauche = reporter (demain / +3 jours),
appui long déjà affecté au report. C'est le geste qui manque le plus à une
application de tâches : aujourd'hui, terminer une tâche impose de viser une
case de 24 pt. **M**

### 2.2 « Annuler » après une action destructive

Supprimer, archiver ou vider les archives est immédiat et définitif. Un bandeau
« Annuler » pendant 5 s (avant écriture en stockage) supprime le risque. **M**

### 2.3 Sous-tâches incomplètes

**Constat.** Le contexte n'expose que `addSubtask` et `toggleSubtask` : on ne
peut ni renommer, ni supprimer, ni réordonner une sous-tâche. Une faute de
frappe est définitive.

**Proposition.** `updateSubtask`, `removeSubtask`, `reorderSubtasks` + un
appui long sur la sous-tâche. **M**

### 2.4 Ordre manuel du jour

Dans « Aujourd'hui », l'ordre est imposé par l'échéance ou la priorité. Un
glisser-déposer pour décider de son ordre de travail serait un vrai gain ; le
modèle peut le porter avec un champ `position`. **L**

### 2.5 Tâches sans échéance

**Constat.** Toute tâche a une `dueDate` obligatoire (l'ajout rapide force
« aujourd'hui » sinon). La « Boîte de réception » est une catégorie comme une
autre, pas un état sans date. Résultat : on date des tâches qu'on ne sait pas
encore quand faire, et on fabrique du retard artificiel.

**Proposition.** `dueDate: string | null`, une section « Sans date », et des
filtres adaptés. Chantier le plus structurant de la liste : il touche
`lib/tasks.ts`, les statistiques et le calendrier. **L**

---

## Priorité 3 — pilotage et confort

- **Vue « 7 prochains jours »** : entre « Aujourd'hui » et le calendrier
  mensuel, il manque la liste groupée par jour de la semaine à venir — c'est
  l'écran où l'on prépare sa semaine. **M**
- **Rappels multiples et configurables** : `reminders` est déjà un tableau ;
  l'interface n'en programme qu'un, une heure avant. Proposer J-1, H-1, H-0. **S**
- **Statistiques utiles à la décision** : série de jours consécutifs, et
  surtout la _charge à venir_ (heures planifiées par jour) pour éviter de
  surcharger demain. **M**
- **Notification actionable** : « Terminer » / « Reporter » directement depuis
  la notification, sans ouvrir l'application. **M**
- **Thème sombre** : les tokens sont centralisés dans `constants/theme.ts` ; il
  reste à doubler la table de couleurs et à basculer sur
  `useColorScheme()`. **M**
- **Synchronisation multi-appareils** : assumée hors périmètre aujourd'hui
  (100 % hors ligne). Si elle devient nécessaire, prévoir d'abord un
  horodatage de modification par tâche (`updatedAt`) — sans lui, aucune
  résolution de conflit n'est possible. **L**

---

## Ce qui a déjà été traité

- **Cartes allégées** : deux lignes au lieu de trois, durée estimée et badges
  « En retard » / « Reporté » retirés, catégorie réduite à un point coloré,
  échéance relative (« Aujourd'hui 14:00 », « Demain », « Hier ») avec l'heure
  masquée quand elle vaut 23 h 59. Le report passe par un appui long.
- **Design system unique** : voir `docs/DESIGN_SYSTEM.md`.
