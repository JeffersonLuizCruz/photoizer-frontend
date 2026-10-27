import { test, expect, type Page } from '@playwright/test'

const ADMIN_USER = {
  nome: 'Admin Teste',
  email: 'admin@teste.com',
  papel: 'ADMIN',
  userId: '1',
}

const RESUMO = {
  bytesFotos: 6_442_450_944,
  bytesDerivados: 120_000_000,
  bytesEditadas: 300_000_000,
  bytesDocumentos: 1_500_000,
  bytesPropostas: 300_000,
  bytesOutros: 0,
  bytesTotal: 6_864_000_000,
  volumeTotal: 100_000_000_000,
  volumeLivre: 81_000_000_000,
  percentualUso: 19,
  totalGalerias: 2,
  totalFotos: 302,
  galeriasArquivadas: 0,
  bytesLiberados: 0,
}

const GALERIAS = [
  {
    agendamentoId: 'ag-1',
    clienteNome: 'Ana Finalizada',
    dataHoraEnsaio: '2026-03-10T14:00:00',
    status: 'FINALIZADO',
    quantidadeFotos: 300,
    quantidadeArquivadas: 0,
    bytes: 6_000_000_000,
    bytesFotos: 5_800_000_000,
    bytesDocumentos: 200_000,
    ultimoDownload: '2026-04-01T10:00:00',
    arquivada: false,
    arquivadaEm: null,
    bytesLiberados: 0,
    expurgavel: true,
    motivoBloqueio: null,
  },
  {
    agendamentoId: 'ag-2',
    clienteNome: 'Bruno Em edição',
    dataHoraEnsaio: '2026-05-20T09:00:00',
    status: 'EM_EDICAO',
    quantidadeFotos: 2,
    quantidadeArquivadas: 0,
    bytes: 864_000_000,
    bytesFotos: 800_000_000,
    bytesDocumentos: 0,
    ultimoDownload: null,
    arquivada: false,
    arquivadaEm: null,
    bytesLiberados: 0,
    expurgavel: false,
    motivoBloqueio: 'NAO_FINALIZADO',
  },
]

const ORFAOS = {
  total: 2,
  bytes: 60,
  elegiveis: 1,
  bytesElegiveis: 20,
  desconhecidos: 1,
  listados: 2,
  truncado: false,
  arquivos: [
    {
      caminho: 'ag-1/orig/orig_orfao.jpg',
      bytes: 20,
      modificadoEm: '2026-01-01T10:00:00',
      reconhecido: true,
      elegivel: true,
    },
    {
      caminho: 'ag-1/backup-manual.zip',
      bytes: 40,
      modificadoEm: '2026-01-01T10:00:00',
      reconhecido: false,
      elegivel: false,
    },
  ],
}

const HISTORICO = {
  dias: 30,
  snapshots: [
    {
      data: '2026-10-25',
      bytesFotos: 5_000,
      bytesDerivados: 200,
      bytesEditadas: 100,
      bytesDocumentos: 50,
      bytesPropostas: 10,
      bytesOutros: 0,
      bytesTotal: 5_360,
      volumeTotal: 100_000,
      volumeLivre: 94_640,
      totalFotos: 10,
      totalGalerias: 1,
      galeriasArquivadas: 0,
      fotosArquivadas: 0,
      bytesLiberadosNoDia: 0,
      coletadoEm: '2026-10-25T23:55:00',
    },
    {
      data: '2026-10-26',
      bytesFotos: 4_500,
      bytesDerivados: 200,
      bytesEditadas: 100,
      bytesDocumentos: 50,
      bytesPropostas: 10,
      bytesOutros: 0,
      bytesTotal: 4_860,
      volumeTotal: 100_000,
      volumeLivre: 95_140,
      totalFotos: 9,
      totalGalerias: 1,
      galeriasArquivadas: 1,
      fotosArquivadas: 1,
      bytesLiberadosNoDia: 500,
      coletadoEm: '2026-10-26T23:55:00',
    },
  ],
}

interface MockCallbacks {
  onExpurgar?: () => void
  onLimparOrfaos?: () => void
  onColetarHistorico?: () => void
  historico?: unknown
}

async function mockApi(page: Page, callbacks: MockCallbacks = {}) {
  await page.addInitScript((user) => {
    window.localStorage.setItem('photoizer_auth_token', 'e2e-test-token')
    window.localStorage.setItem('photoizer_auth_user', JSON.stringify(user))
  }, ADMIN_USER)

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/api/v1', '')
    const metodo = route.request().method()

    if (metodo === 'POST' && path.endsWith('/expurgar')) {
      callbacks.onExpurgar?.()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ fotos: 300, bytesLiberados: 6_000_000_000 }),
      })
      return
    }

    if (metodo === 'POST' && path.endsWith('/orfaos/limpar')) {
      callbacks.onLimparOrfaos?.()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ arquivos: 1, bytesLiberados: 20 }),
      })
      return
    }

    if (metodo === 'POST' && path.endsWith('/historico/coletar')) {
      callbacks.onColetarHistorico?.()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(HISTORICO.snapshots[1]),
      })
      return
    }

    let body: unknown = []
    if (path === '/auth/me') body = ADMIN_USER
    else if (path === '/notificacoes') {
      body = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 }
    } else if (path === '/notificacoes/nao-lidas') body = { total: 0, quantidade: 0 }
    else if (path === '/admin/armazenamento/resumo') body = RESUMO
    else if (path === '/admin/armazenamento/galerias') body = GALERIAS
    else if (path === '/admin/armazenamento/orfaos') body = ORFAOS
    else if (path === '/admin/armazenamento/historico') body = callbacks.historico ?? HISTORICO

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
}

test.describe('Armazenamento', () => {
  test('lista galerias com elegibilidade e resumo do volume', async ({ page }) => {
    await mockApi(page)
    await page.goto('/admin/armazenamento')
    await page.waitForTimeout(1200)

    await expect(page.getByRole('heading', { name: 'Armazenamento' })).toBeVisible()
    await expect(page.getByText('Ana Finalizada').last()).toBeVisible()
    await expect(page.getByText('Bruno Em edição').last()).toBeVisible()
    await expect(page.getByText('Volume do servidor')).toBeVisible()

    const botoes = page.locator('button:visible').filter({ hasText: 'Liberar espaço' })
    await expect(botoes).toHaveCount(2)
    await expect(botoes.first()).toBeEnabled()
    await expect(botoes.nth(1)).toBeDisabled()

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
  })

  test('exige a palavra de confirmação e envia o expurgo', async ({ page }) => {
    let expurgos = 0
    await mockApi(page, { onExpurgar: () => { expurgos += 1 } })
    await page.goto('/admin/armazenamento')
    await page.waitForTimeout(1200)

    await page.locator('button:visible').filter({ hasText: 'Liberar espaço' }).first().click()
    await expect(page.getByRole('heading', { name: 'Liberar espaço desta galeria?' })).toBeVisible()

    const confirmar = page.getByRole('button', { name: 'Expurgar arquivos' })
    await expect(confirmar).toBeDisabled()

    await page.getByLabel(/Digite/).fill('EXPURGAR')
    await expect(confirmar).toBeEnabled()
    await confirmar.click()

    await page.waitForTimeout(500)
    expect(expurgos).toBe(1)
    await expect(page.getByText(/expurgada\(s\)/)).toBeVisible()
  })

  test('analisa e limpa arquivos órfãos elegíveis', async ({ page }) => {
    let limpezas = 0
    await mockApi(page, { onLimparOrfaos: () => { limpezas += 1 } })
    await page.goto('/admin/armazenamento')
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: 'Analisar órfãos' }).click()
    await expect(page.getByText('2 arquivo(s)')).toBeVisible()
    await expect(page.getByText('Desconhecido', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Limpar órfãos elegíveis' }).click()
    await page.getByRole('button', { name: 'Limpar', exact: true }).click()

    await page.waitForTimeout(500)
    expect(limpezas).toBe(1)
    await expect(page.getByText(/órfão\(s\) removido\(s\)/)).toBeVisible()
  })

  test('exibe o histórico diário e coleta sob demanda', async ({ page }) => {
    let coletas = 0
    await mockApi(page, { onColetarHistorico: () => { coletas += 1 } })
    await page.goto('/admin/armazenamento')
    await page.waitForTimeout(1200)

    await expect(page.getByText('Histórico de consumo')).toBeVisible()
    await expect(page.getByText('Consumo por categoria')).toBeVisible()
    await expect(page.getByText('Espaço livre no volume')).toBeVisible()
    await expect(page.getByRole('button', { name: '30 dias' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: '365 dias' })).toHaveAttribute('aria-pressed', 'false')

    await page.getByRole('button', { name: 'Coletar agora' }).click()
    await page.waitForTimeout(500)
    expect(coletas).toBe(1)
    await expect(page.getByText('Snapshot de hoje coletado')).toBeVisible()
  })

  test('mostra estado vazio quando ainda não há snapshots', async ({ page }) => {
    await mockApi(page, { historico: { dias: 30, snapshots: [] } })
    await page.goto('/admin/armazenamento')
    await page.waitForTimeout(1200)

    await expect(page.getByText('Ainda não há histórico')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Coletar agora' })).toBeVisible()
  })

  test('link de galeria arquivada mostra aviso ao cliente', async ({ page }) => {
    await page.route('**/api/v1/ecommerce/galeria/**', async (route) => {
      await route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'GALERIA_ARQUIVADA',
          message: 'Esta galeria foi arquivada.',
        }),
      })
    })

    await page.goto('/g/e2e-token')
    await page.waitForTimeout(800)

    await expect(page.getByText('Esta galeria foi arquivada')).toBeVisible()
  })
})
