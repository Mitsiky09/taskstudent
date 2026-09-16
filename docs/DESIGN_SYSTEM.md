# Design system de TaskStudent

Ce document décrit le système de style unique de l'application. Toute nouvelle
interface doit s'y conformer : c'est ce qui garantit que l'Accueil, l'Agenda,
les feuilles modales et l'écran de détail d'une tâche aient exactement le même
visage.

## Où vivent les tokens

| Fichier              | Rôle                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `constants/theme.ts` | **Source de vérité.** Nuances, tokens sémantiques, rayons, ombres, typographies, surfaces.    |
| `tailwind.config.js` | Expose ces mêmes valeurs sous forme de classes (`bg-primary`, `text-faint`, `rounded-card`…). |

`tailwind.config.js` importe la palette depuis `constants/theme.ts` : il est
donc impossible d'avoir une couleur dans les classes et une autre dans les
styles inline.

## Couleurs

### Tokens sémantiques (`theme.colors`)

À utiliser dans les styles inline (icônes, `react-native-calendars`,
`react-native-svg`, `placeholderTextColor`…).

| Token           | Valeur               | Usage                                                  |
| --------------- | -------------------- | ------------------------------------------------------ |
| `primary`       | `#4f46e5`            | Marque : boutons, onglet actif, liens, sélections      |
| `primarySoft`   | `#eef2ff`            | Fond teinté d'un état sélectionné discret              |
| `background`    | `#f8fafc`            | Fond global (identique à `app.json > backgroundColor`) |
| `surface`       | `#ffffff`            | Cartes, feuilles modales, barre d'onglets              |
| `surfaceMuted`  | `#f1f5f9`            | Champs de saisie et pastilles posés sur du blanc       |
| `border`        | `#e2e8f0`            | Bordures visibles                                      |
| `borderSoft`    | `#f1f5f9`            | Bordure discrète des cartes                            |
| `text`          | `#0f172a`            | Titres                                                 |
| `textSecondary` | `#475569`            | Texte courant                                          |
| `textMuted`     | `#94a3b8`            | Mentions, icônes, placeholders                         |
| `success`       | `#10b981`            | Tâche terminée                                         |
| `warning`       | `#f59e0b`            | Tâche reportée                                         |
| `danger`        | `#f43f5e`            | Retard, action destructive                             |
| `info`          | `#0ea5e9`            | Information secondaire, « à faire »                    |
| `overlay`       | `rgba(15,23,42,.45)` | Voile des feuilles modales                             |

Les mêmes valeurs sont disponibles en classes : `bg-primary`, `bg-canvas`,
`bg-surface-muted`, `border-line`, `border-line-soft`, `text-ink`, `text-soft`,
`text-muted`, `text-faint`, `text-danger`, `bg-warning-50`…

> Règle : **aucune couleur hexadécimale en dur dans un écran ou un composant.**
> Si une couleur manque, on ajoute un token, on ne l'invente pas localement.

### Couleurs métier (`constants/index.ts`)

- `PRIORITY_COLORS` — P1 `danger`, P3 `primary`, P4 `textMuted`.
- `STATUS_COLORS` — à faire / reportée / terminée / en retard, utilisés par les
  graphiques et les pastilles.
- `CATEGORY_COLORS` — palette proposée à la création d'une catégorie ; elle ne
  contient que des teintes compatibles avec le système.

## Typographie (`theme.typography`)

| Constante   | Classes                                                     | Usage               |
| ----------- | ----------------------------------------------------------- | ------------------- |
| `display`   | `text-[28px] font-bold tracking-tight text-ink`             | Titre d'écran       |
| `title`     | `text-xl font-bold tracking-tight text-ink`                 | Titre secondaire    |
| `section`   | `text-lg font-bold tracking-tight text-ink`                 | En-tête de section  |
| `eyebrow`   | `text-xs font-semibold uppercase tracking-wider text-faint` | Étiquette de groupe |
| `cardTitle` | `text-base font-semibold text-ink`                          | Titre de carte      |
| `body`      | `text-sm text-soft`                                         | Texte courant       |
| `caption`   | `text-xs text-faint`                                        | Mention discrète    |

## Surfaces, rayons, ombres

- `Card` (`components/ui/Card.tsx`) est la **seule** façon de poser une surface
  blanche : `variant="panel"` (24 px, écrans de statistiques et réglages) ou
  `variant="card"` (16 px, cartes de liste).
- Les feuilles modales utilisent `Sheet` (`components/ui/Sheet.tsx`) : même
  voile, même poignée, mêmes marges, même respect de la zone sûre.
- Les ombres viennent de `shadows.card`, `shadows.raised` et `shadows.floating`
  (objets de style, donc identiques sur iOS et Android).
- Marges de mise en page (`theme.space`) : écran 20 pt, carte 20 pt, section
  28 pt (`mb-7`), élément de liste 10 pt (`mb-2.5`).

## Composants d'interface partagés

| Composant                      | Rôle                                                           |
| ------------------------------ | -------------------------------------------------------------- |
| `ui/Screen`                    | Conteneur d'écran : fond `bg-canvas` + marges latérales        |
| `ui/Card`                      | Surface blanche (panneau ou carte de liste), cliquable ou non  |
| `ui/Sheet`                     | Feuille modale (+ `SheetOption`, `SheetAction`)                |
| `ui/Chip`                      | Pastille : filtres, catégories, étiquettes actives             |
| `ui/SegmentedControl`          | Sélecteur à segments (tri, statut, période)                    |
| `ui/TextField`                 | Champ de saisie (+ `ClearButton`), variantes `muted`/`surface` |
| `ui/IconButton`                | Bouton d'icône rond, cerclé ou nu                              |
| `ui/SectionHeader`             | Titre de section + compteur + raccourci « Voir tout »          |
| `Header`                       | En-tête d'écran (titre, sous-titre, retour, action droite)     |
| `EmptyState`                   | État vide                                                      |
| `FilterBar`                    | Barre de filtres horizontale (construite sur `Chip`)           |
| `PrimaryButton`                | Bouton : `primary`, `soft`, `dark`, `ghost`, `danger`          |
| `TaskCard` / `TaskCardArchive` | Cartes de tâche                                                |

## Conventions

1. **Icônes.** Une seule famille : `Ionicons` (`@expo/vector-icons`).
2. **Fond d'écran.** `bg-canvas` partout ; le blanc est réservé aux surfaces.
3. **Champs de saisie.** Sur une carte blanche → `variant="muted"` ; directement
   sur le fond → `variant="surface"` (blanc cerclé).
4. **États.** Retard = `danger`, reporté = `warning`, terminé = `success`,
   sélection = `primary`. Aucune autre combinaison.
5. **Barre d'onglets flottante** (`app/(tabs)/_layout.tsx`) : sa structure, sa
   géométrie et ses animations sont figées. Seules les couleurs proviennent des
   tokens.

## Ajouter un écran

```tsx
<Screen>
  <Header title="Mon écran" subtitle="Sous-titre" />
  <Card className="mb-7">
    <Text className="text-xs font-semibold uppercase tracking-wider text-faint">Section</Text>
    {/* … */}
  </Card>
</Screen>
```

## Vérifications

```bash
npm run typecheck   # typage de tout le projet
npm run lint        # ESLint
npm test            # logique métier
```

Pour contrôler qu'aucune classe n'est inventée (une classe inconnue est
silencieusement ignorée par NativeWind) :

```bash
npx tailwindcss -c tailwind.config.js -i global.css -o /tmp/out.css
```

puis vérifier que chaque classe utilisée apparaît bien dans `/tmp/out.css`.
