import { test, expect, type Page } from '@playwright/test'

const AGENDAMENTO_ID = 'e2e-galeria-1'
const ADMIN_USER = {
  nome: 'Admin Teste',
  email: 'admin@teste.com',
  papel: 'ADMIN',
  userId: '1',
}

const IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

function foto(numero: number, selecionadaPacote: boolean) {
  return {
    id: `foto-${numero}`,
    agendamentoId: AGENDAMENTO_ID,
    fileName: `IMG_${numero}.jpg`,
    originalUrl: null,
    watermarkedUrl: IMG,
    thumbUrl: IMG,
    ordem: numero - 1,
    numeroGaleria: numero,
    status: 'PUBLICADA',
    versaoAtual: 'ORIGINAL',
    temVersaoEditada: false,
    emSelecaoEdicao: false,
    editadaFileName: null,
    editadaEm: null,
    selecionadaPacote,
    downloadada: false,
    compraExtraId: null,
    createdAt: '2026-01-01T10:00:00',
    titulo: null,
    descricao: null,
    tags: [],
    categoria: null,
    dataSessao: null,
    metadataExif: null,
    destaque: false,
    fotoEdicaoId: null,
    visivel: true,
    arquivosRemovidos: false,
  }
}

const FOTOS = [foto(1, true), foto(2, true), foto(3, false)]

function item(numero: number, tipo: 'PACOTE' | 'EXTRA', editada = true) {
  return {
    fotoId: `foto-${numero}`,
    numeroGaleria: numero,
    nomeArquivo: `IMG_${numero}.jpg`,
    tipo,
    ordem: numero - 1,
    valorUnitario: tipo === 'EXTRA' ? 15 : null,
    editada,
    editadaEm: editada ? '2026-01-02T10:00:00' : null,
    foto: FOTOS[numero - 1],
  }
}

const SELECAO_PUBLICADA = {
  id: 'selecao-2',
  agendamentoId: AGENDAMENTO_ID,
  numero: 2,
  status: 'PUBLICADA',
  observacaoCliente: 'Seleção de teste',
  enviadaEm: '2026-01-02T10:00:00',
  iniciadaEm: null,
  concluidaEm: null,
  publicadaEm: null,
  originaisBaixadosEm: null,
  quantidadePacote: 2,
  quantidadeExtras: 1,
  itens: [item(1, 'PACOTE'), item(2, 'PACOTE'), item(3, 'EXTRA')],
}

const SELECAO_CANCELADA = {
  ...SELECAO_PUBLICADA,
  id: 'selecao-1',
  numero: 1,
  status: 'CANCELADA',
  itens: [item(1, 'PACOTE', false), item(3, 'EXTRA', false)],
  quantidadePacote: 1,
  quantidadeExtras: 1,
}

const AGENDAMENTO = {
  id: AGENDAMENTO_ID,
  tokenGaleria: 'e2e-token',
  status: 'FINALIZADO',
  clienteNome: 'Cliente E2E',
  pacoteNome: 'Pacote E2E',
  dataHoraEnsaio: '2026-10-25T10:00:00',
  localEnsaio: 'Estúdio E2E',
}

const GALERIA = {
  agendamentoId: AGENDAMENTO_ID,
  modo: 'COM_EDICAO',
  fase: 'COMERCIALIZACAO',
  selecaoAtualId: 'selecao-2',
  capaFotoId: null,
  capaVersao: null,
  podeAlterarModo: false,
  arquivada: false,
  arquivadaEm: null,
  bytesLiberados: 0,
}

const RESUMO = {
  totalFotos: FOTOS.length,
  fotosPublicadas: FOTOS.length,
  fotosSelecionadasPacote: 2,
  pacoteQuantidadeFotos: 2,
  fotosPagas: 0,
  fotosAguardando: 0,
  fotos: FOTOS,
  comprasExtras: [],
  valorTotalExtras: 15,
  favoritosPorFoto: { 'foto-1': 2 },
  fotosFavoritas: 2,
  linkGaleria: null,
  tokenGaleria: 'e2e-token',
}

function bodyFor(path: string): unknown {
  if (path === '/auth/me') return ADMIN_USER
  if (path === '/notificacoes') return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 }
  if (path === '/notificacoes/nao-lidas') return { total: 0, quantidade: 0 }
  if (path === `/agendamentos/${AGENDAMENTO_ID}`) return AGENDAMENTO
  if (path === `/agendamentos/${AGENDAMENTO_ID}/fotos`) return FOTOS
  if (path === `/admin/agendamentos/${AGENDAMENTO_ID}/galeria`) return GALERIA
  if (path === `/admin/agendamentos/${AGENDAMENTO_ID}/selecoes`) return [SELECAO_PUBLICADA, SELECAO_CANCELADA]
  if (path === `/admin/agendamentos/${AGENDAMENTO_ID}/ecommerce`) return RESUMO
  if (path === `/ecommerce/admin/comentarios/agendamentos/${AGENDAMENTO_ID}`) return []
  return []
}

async function mockApi(page: Page) {
  await page.addInitScript((user) => {
    window.localStorage.setItem('photoizer_auth_token', 'e2e-test-token')
    window.localStorage.setItem('photoizer_auth_user', JSON.stringify(user))
  }, ADMIN_USER)

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/api/v1', '')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(bodyFor(path)),
    })
  })
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth - el.clientWidth
  })
}

test.describe('Galeria administrativa - workspace mobile', () => {
  test('visão geral mostra pacote e extras sem overflow', async ({ page }) => {
    await mockApi(page)
    await page.goto(`/agenda/${AGENDAMENTO_ID}/fotos`)
    await page.waitForTimeout(1200)

    await expect(page.getByRole('tab', { name: /Visão geral/ })).toBeVisible()
    await expect(page.getByText('No pacote', { exact: true })).toBeVisible()
    await expect(page.getByText('Extras', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cliente E2E', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Gerenciar fotos' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Seleção do cliente' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Compras' })).toHaveCount(0)
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
  })

  test('aba Fotos filtra extras e abre o menu de ações', async ({ page }) => {
    await mockApi(page)
    await page.goto(`/agenda/${AGENDAMENTO_ID}/fotos?tab=fotos`)
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: /^Extras/ }).first().click()
    await expect(page.getByText('Extra', { exact: true }).first()).toBeVisible()

    await page.getByRole('button', { name: /Ações de/ }).first().click()
    await expect(page.getByText('Ações da foto')).toBeVisible()
    await expect(page.getByText('Editar metadados')).toBeVisible()
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
  })

  test('aba Seleção separa pacote/extras e abre o histórico', async ({ page }) => {
    await mockApi(page)
    await page.goto(`/agenda/${AGENDAMENTO_ID}/fotos?tab=selecao`)
    await page.waitForTimeout(1200)

    await expect(page.getByText('Fotos do pacote (2)')).toBeVisible()
    await expect(page.getByText('Fotos extras (1)')).toBeVisible()
    await expect(page.getByText('Histórico de seleções')).toBeVisible()

    await page.getByRole('button', { name: /Seleção #1/ }).first().click()
    await expect(page.getByText('Histórico da seleção')).toBeVisible()
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
  })

  test('aba Compras carrega o resumo de compras', async ({ page }) => {
    await mockApi(page)
    await page.goto(`/agenda/${AGENDAMENTO_ID}/fotos?tab=compras`)
    await page.waitForTimeout(1200)

    await expect(page.getByText('Valor em extras')).toBeVisible()
    await expect(page.getByText('Nenhuma compra de extra ainda')).toBeVisible()
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
  })

  test('mostra erro de carregamento e permite tentar novamente', async ({ page }) => {
    await mockApi(page)
    await page.route('**/api/v1/admin/agendamentos/**/selecoes', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Falha simulada' }),
      })
    })

    await page.goto(`/agenda/${AGENDAMENTO_ID}/fotos`)
    await page.waitForTimeout(1200)

    await expect(page.getByText('Não foi possível carregar a visão geral')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  })
})
