import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  /** Marge latérale de l'écran (20 pt), désactivable pour les listes pleine largeur. */
  padded?: boolean;
  edges?: Edge[];
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Conteneur d'écran : fond et marges latérales identiques partout. Le contenu
 * défile (ScrollView / FlatList) reste à la charge de l'écran.
 */
export default function Screen({
  children,
  padded = true,
  edges = ['top'],
  className = '',
  style,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-canvas ${className}`} style={style}>
      <View className={`flex-1 ${padded ? 'px-5' : ''}`}>{children}</View>
    </SafeAreaView>
  );
}
