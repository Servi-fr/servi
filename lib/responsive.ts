import { useWindowDimensions } from 'react-native';

// Breakpoints : compact = téléphone | regular = petit iPad / split view | large = iPad plein / Mac
export type Breakpoint = 'compact' | 'regular' | 'large';

export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const bp: Breakpoint = width >= 1024 ? 'large' : width >= 700 ? 'regular' : 'compact';
  return {
    width,
    height,
    bp,
    isCompact: bp === 'compact',
    isRegularUp: bp !== 'compact',
    isLarge: bp === 'large',
    // Largeur de lecture max sur grand écran (undefined sur téléphone → aucun changement).
    contentMaxWidth: bp === 'large' ? 940 : bp === 'regular' ? 720 : undefined,
    // Colonnes pour les grilles de cartes.
    columns: bp === 'large' ? 3 : bp === 'regular' ? 2 : 1,
  };
}

// Style à appliquer au contentContainerStyle d'un ScrollView pour centrer + borner le contenu.
// Sur téléphone, renvoie un objet vide → comportement inchangé.
export function centeredContent(maxWidth: number | undefined) {
  return maxWidth ? { maxWidth, width: '100%' as const, alignSelf: 'center' as const } : null;
}
