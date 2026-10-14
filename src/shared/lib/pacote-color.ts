import type { CSSProperties } from 'react'

export interface PacoteColorOption {
  value: string
  label: string
}

export const PACKAGE_COLORS: PacoteColorOption[] = [
  { value: '#F9A8D4', label: 'Rosa claro' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#F97316', label: 'Laranja' },
  { value: '#F59E0B', label: 'Âmbar' },
  { value: '#22C55E', label: 'Verde' },
  { value: '#10B981', label: 'Esmeralda' },
  { value: '#06B6D4', label: 'Ciano' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#6366F1', label: 'Índigo' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#64748B', label: 'Cinza' },
]

export const DEFAULT_PACKAGE_COLOR = '#64748B'

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

export function isValidPackageColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value)
}

export function normalizePackageColor(value: string | null | undefined): string {
  return value && isValidPackageColor(value) ? value.toUpperCase() : DEFAULT_PACKAGE_COLOR
}

function relativeLuminance(hex: string): number {
  const toLinear = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  const r = toLinear(parseInt(hex.slice(1, 3), 16) / 255)
  const g = toLinear(parseInt(hex.slice(3, 5), 16) / 255)
  const b = toLinear(parseInt(hex.slice(5, 7), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(luminanceA: number, luminanceB: number): number {
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}

const DARK_TEXT = '#000000'

/**
 * Escolhe entre texto quase-preto e branco o que tiver maior contraste (WCAG)
 * sobre a cor de fundo informada.
 */
export function getReadableTextColor(hex: string | null | undefined): string {
  const background = relativeLuminance(normalizePackageColor(hex))
  const onWhite = contrastRatio(1, background)
  const onDark = contrastRatio(background, relativeLuminance(DARK_TEXT))
  return onDark >= onWhite ? DARK_TEXT : '#FFFFFF'
}

/**
 * Estilo inline para uma tarja/chip colorido pelo pacote. O Tailwind não gera
 * classes para cores dinâmicas, por isso usamos style com contraste calculado.
 */
export function pacoteColorStyle(hex: string | null | undefined): CSSProperties {
  const backgroundColor = normalizePackageColor(hex)
  return {
    backgroundColor,
    color: getReadableTextColor(backgroundColor),
    borderColor: backgroundColor,
  }
}
