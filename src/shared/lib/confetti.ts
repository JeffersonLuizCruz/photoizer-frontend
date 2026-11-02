import confetti from 'canvas-confetti'

/**
 * Cores alinhadas ao tema editorial da galeria (terracota/creme/ink).
 */
const CORES = ['#b07a52', '#211d19', '#f7f2ea', '#e7ded1', '#d9a066']

/**
 * Explosão de confete para celebrar o pacote completo.
 *
 * - Respeita `prefers-reduced-motion` (não anima).
 * - O canvas do canvas-confetti é fixo, fica acima dos modais e não captura
 *   cliques.
 * - Deve ser chamado apenas no evento que completa o pacote; o controle de
 *   "uma vez por carregamento" fica na página.
 */
export function dispararConfete(): void {
  if (typeof window === 'undefined') return

  const reduzirMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduzirMovimento) return

  const base = {
    colors: CORES,
    zIndex: 100,
    disableForReducedMotion: true,
  }

  confetti({
    ...base,
    particleCount: 80,
    spread: 75,
    startVelocity: 45,
    gravity: 0.9,
    ticks: 180,
    origin: { x: 0.5, y: 0.65 },
  })

  window.setTimeout(() => {
    confetti({
      ...base,
      particleCount: 45,
      angle: 60,
      spread: 55,
      startVelocity: 40,
      origin: { x: 0, y: 0.7 },
    })
    confetti({
      ...base,
      particleCount: 45,
      angle: 120,
      spread: 55,
      startVelocity: 40,
      origin: { x: 1, y: 0.7 },
    })
  }, 150)
}
