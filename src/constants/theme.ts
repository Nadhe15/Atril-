// src/constants/theme.ts

/**
 * Sistema de Diseño Centralizado ATRIL v5.0 (MVP)
 * Paleta Institucional de Alto Contraste WCAG AA
 */
export const THEME = {
  primary: '#0047AB', // Azul Rey
  primaryHover: '#003580',
  navy: '#0A192F', // Azul Marino Profundo
  background: '#F4F7FC',
  surface: '#FFFFFF',
  surfaceSub: '#EBF2FA',
  gold: '#FFBF00',

  // Estados Semánticos — Éxito
  success: '#047857',
  successTint: '#D1FAE5',
  successText: '#065F46',

  // Estados Semánticos — Peligro / Error
  danger: '#C81E1E',
  dangerTint: '#FEE2E2',
  dangerText: '#991B1B',

  // Estados Semánticos — Advertencia / Pendiente
  warnTint: '#FEF3C7',
  warnText: '#92400E',

  // Tipografía de Alto Contraste AA
  textTitle: '#0A192F',
  textBody: '#1E293B',
  textMuted: '#334155',

  // Bordes y Divisores
  borderUi: '#475569',
  borderSoft: '#64748B',
} as const;

export const COLORS = THEME;

export type ThemeColors = typeof THEME;

export default THEME;
