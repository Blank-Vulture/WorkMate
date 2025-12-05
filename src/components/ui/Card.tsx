/**
 * Custom Card component
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevation?: number;
}

export function Card({ children, style, padding = 16, elevation = 1 }: CardProps) {
  const theme = useTheme();

  return (
    <Surface
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          padding,
        },
        style,
      ]}
      elevation={elevation as 0 | 1 | 2 | 3 | 4 | 5}
    >
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginVertical: 8,
  },
});

