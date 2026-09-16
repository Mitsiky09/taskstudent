/**
 * Identifiants locaux.
 *
 * `uuid` a été écarté : sur React Native il exige un polyfill de
 * `crypto.getRandomValues`, pour un besoin qui se limite ici à distinguer des
 * enregistrements stockés sur un seul appareil. L'horodatage garantit
 * l'unicité entre deux créations, le suffixe aléatoire à l'intérieur d'une
 * même milliseconde.
 */
export function createId(prefix = 't'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
