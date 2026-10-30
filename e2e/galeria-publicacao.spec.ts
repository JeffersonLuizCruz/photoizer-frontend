import { test, expect, type Page } from '@playwright/test'

const AGENDAMENTO_ID = 'e2e-publicacao-1'
const ADMIN_USER = {
  nome: 'Admin Teste',
  email: 'admin@teste.com',
  papel: 'ADMIN',
  userId: '1',
}
const FOTOGRAFO_USER = { ...ADMIN_USER, nome: 'Fotógrafo Teste', papel: 'FOTOGRAFO', userId: '2' }
const IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

const foto = (numero: number) => ({
  id: `foto-${numero}`,
  agendamentoId: AGENDAMENTO_ID,
  fileName: `IMG_${numero}.jpg`,
  originalUrl: null,
  watermarkedUrl: IMG,
  thumbUrl: IMG,
  ordem: numero - 1,
  numeroGaleria: null,
  status: 'INEDITA',
  versaoAtual: 'ORIGINAL',
  temVersaoEditada: false,
  emSelecaoEdicao: false,
  editadaFileName: null,
  editadaEm: null,
  selecionadaPacote: false,
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
})

const AGENDAMENTO = {
  id: AGENDAMENTO_ID,
  tokenGaleria: 'e2e-token',
  status: 'FINALIZADO',
  clienteNome: 'Cliente E2E',
  pacoteNome: 'Pacote E2E',
  dataHoraEnsaio: '2026-10-25T10:00:00',
  localEnsaio: 'Estúdio E2E',
}

interface EstadoMock {
  fotos: ReturnType<typeof foto>[]
  galeria: {
    agendamentoId: string
    modo: string
    fase: string
    selecaoAtualId: null
    capaFotoId: null
    capaVersao: null
    tituloHero: null
    qualidadePreview: string
    requerEdicao: boolean
    podeAlterarModo: boolean
    arquivada: boolean
    arquivadaEm: null
    bytesLiberados: number
    publicadaEm: null
  }
  chamadas: string[]
}

function criarEstado(): EstadoMock {
  return {
    fotos: [foto(1), foto(2)],
    galeria: {
      agendamentoId: AGENDAMENTO_ID,
      modo: 'COM_EDICAO',
      fase: 'SELECAO',
      selecaoAtualId: null,
      capaFotoId: null,
      capaVersao: null,
      tituloHero: null,
      qualidadePreview: 'ORIGINAL',
      requerEdicao: true,
      podeAlterarModo: true,
      arquivada: false,
      arquivadaEm: null,
      bytesLiberados: 0,
      publicadaEm: null,
    },
    chamadas: [],
  }
}

function resumo(estado: EstadoMock) {
  return {
    totalFotos: estado.fotos.length,
    fotosPublicadas: estado.fotos.filter((f) => f.status === 'PUBLICADA').length,
    fotosSelecionadasPacote: 0,
    pacoteQuantidadeFotos: 2,
    fotosPagas: 0,
    fotosAguardando: 0,
    fotos: estado.fotos,
    comprasExtras: [],
    valorTotalExtras: 0,
    favoritosPorFoto: {},
    fotosFavoritas: 0,
    linkGaleria: null,
    tokenGaleria: 'e2e-token',
  }
}

function bodyFor(path: string, estado: EstadoMock, user: typeof ADMIN_USER): unknown {
  if (path === '/auth/me') return user
  if (path === '/notificacoes') return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 }
  if (path === '/notificacoes/nao-lidas') return { total: 0, quantidade: 0 }
  if (path === `/agendamentos/${AGENDAMENTO_ID}`) return AGENDAMENTO
  if (path === `/agendamentos/${AGENDAMENTO_ID}/fotos`) return estado.fotos
  if (path === `/admin/agendamentos/${AGENDAMENTO_ID}/galeria`) return estado.galeria
  if (path === `/admin/agendamentos/${AGENDAMENTO_ID}/selecoes`) return []
  if (path === `/admin/agendamentos/${AGENDAMENTO_ID}/ecommerce`) return resumo(estado)
  return []
}

async function mockApi(page: Page, user: typeof ADMIN_USER) {
  const estado = criarEstado()

  await page.addInitScript((usuario) => {
    window.localStorage.setItem('photoizer_auth_token', 'e2e-test-token')
    window.localStorage.setItem('photoizer_auth_user', JSON.stringify(usuario))
  }, user)

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/api/v1', '')
    estado.chamadas.push(`${request.method()} ${path}`)

    if (request.method() === 'PUT' && path === `/admin/agendamentos/${AGENDAMENTO_ID}/galeria/modo`) {
      const payload = JSON.parse(request.postData() ?? '{}') as { modo: string }
      estado.galeria = {
        ...estado.galeria,
        modo: payload.modo,
        requerEdicao: payload.modo === 'COM_EDICAO',
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(estado.galeria) })
    }

    if (request.method() === 'PATCH' && path === `/agendamentos/${AGENDAMENTO_ID}/fotos/publicar`) {
      estado.fotos = estado.fotos.map((item, indice) => ({
        ...item,
        status: 'PUBLICADA',
        numeroGaleria: item.numeroGaleria ?? indice + 1,
      }))
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(estado.fotos) })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(bodyFor(path, estado, user)),
    })
  })

  return estado
}

test.describe('Publicação da galeria - escolha do fluxo', () => {
  test('ADMIN escolhe o fluxo na primeira publicação', async ({ page }) => {
    const estado = await mockApi(page, ADMIN_USER)

    await page.goto(`/agenda/${AGENDAMENTO_ID}/fotos`)
    await page.waitForTimeout(1200)

    await expect(page.getByText('Fluxo a definir')).toBeVisible()
    const fluxo = page.locator('section', { hasText: 'Fluxo de entrega' })
    await expect(fluxo.getByRole('button', { name: /Editar após a seleção/ })).toBeDisabled()
    await expect(fluxo.getByRole('button', { name: /Entrega direta/ })).toBeDisabled()

    await page.getByRole('button', { name: 'Publicar 2 foto(s)' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Escolha o fluxo de entrega' })).toBeVisible()
    const confirmar = dialog.getByRole('button', { name: 'Escolher fluxo e publicar' })
    await expect(confirmar).toBeDisabled()

    await dialog.getByRole('button', { name: /Entrega direta/ }).click()
    await expect(confirmar).toBeEnabled()
    await confirmar.click()

    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByText('Entrega direta').first()).toBeVisible()
    expect(estado.chamadas).toContain(`PUT /admin/agendamentos/${AGENDAMENTO_ID}/galeria/modo`)
    expect(estado.chamadas).toContain(`PATCH /agendamentos/${AGENDAMENTO_ID}/fotos/publicar`)
  })

  test('FOTOGRAFO não consegue definir o fluxo na primeira publicação', async ({ page }) => {
    await mockApi(page, FOTOGRAFO_USER)

    await page.goto(`/agenda/${AGENDAMENTO_ID}/fotos`)
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: 'Publicar 2 foto(s)' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText(/Somente um administrador/)).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Entrega direta/ })).toBeDisabled()
    await expect(dialog.getByRole('button', { name: 'Escolher fluxo e publicar' })).toBeDisabled()
  })
})
