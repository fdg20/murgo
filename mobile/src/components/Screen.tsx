import { ReactNode } from 'react';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  /** Default: top only (bottom tabs handle the home indicator). */
  edges?: Edge[];
  className?: string;
}

export function Screen({
  children,
  edges = ['top'],
  className = 'flex-1 bg-surface',
}: Props) {
  return (
    <SafeAreaView className={className} edges={edges}>
      {children}
    </SafeAreaView>
  );
}
