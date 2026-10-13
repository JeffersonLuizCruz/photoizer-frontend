import { test, expect, type Page } from '@playwright/test'

const ADMIN_USER = {
  nome: 'Admin Teste',
  email: 'admin@teste.com',
  papel: 'ADMIN',
  userId: '1',
}

const PUBLIC_ROUTES = ['/login', '/acesso-cliente']

const ADMIN_ROUTES = [
  '/dashboard',
  '/agenda',
  '/propostas',
  '/propostas/nova',
  '/pacotes',
  '/financeiro',
  '/financeiro/receitas',
  '/financeiro/despesas',
  '/financeiro/fluxo-caixa',
  '/financeiro/relatorios',
  '/config',
  '/comissoes',
  '/admin/ecommerce',
  '/fotografos',
  '/fotografos/novo',
  '/repasses-pendentes',
  '/meu-painel',
  '/minha-agenda',
  '/minhas-financas',
]

async function seedAdminAuth(page: Page) {
  await page.addInitScript((user) => {
    window.localStorage.setItem('photoizer_auth_token', 'e2e-test-token')
    window.localStorage.setItem('photoizer_auth_user', JSON.stringify(user))
  }, ADMIN_USER)
}

const PROPOSTA_PUBLICA = {
  status: 'PRE_RESERVA',
  podeAssinar: true,
  contratadaNome: 'Estúdio Photoizer',
  contratadaCnpj: '00.000.000/0001-00',
  contratadaCidade: 'São Paulo/SP',
  pixChave: 'pix@photoizer.com',
  pixTipoChave: 'E-mail',
  pacoteNome: 'Ensaio Praia',
  valorPacote: 900,
  precoFotoExtra: 50,
  dataHoraEnsaio: '2026-12-20T08:00:00',
  duracaoMinutos: 60,
  localEnsaio: 'Praia de Copacabana',
  taxaDeslocamento: 0,
  percentualEntrada: 30,
  valorTotal: 900,
  valorEntradaExigido: 270,
  valorRestante: 630,
  clausulasHtml: '<p>Contrato de teste.</p>',
  fotografoResponsavel: 'Jefferson Luiz',
  fotografos: [{ nome: 'Jefferson Luiz', papel: 'FOTOGRAFO' }],
}

function bodyFor(url: string): unknown {
  const path = url.split('/api/v1')[1]?.split('?')[0] ?? ''
  if (path.startsWith('/propostas/publico/')) return PROPOSTA_PUBLICA
  switch (path) {
    case '/auth/me':
      return ADMIN_USER
    case '/notificacoes':
      return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 }
    case '/notificacoes/nao-lidas':
      return { total: 0, quantidade: 0 }
    case '/dashboard/ecommerce':
      return {
        totalCompras: 0,
        totalFotosExtras: 0,
        totalFaturado: 0,
        ticketMedio: 0,
        topClientes: [],
      }
    case '/dashboard/financeiro-mensal':
      return { mesAtual: {}, historico: [] }
    case '/financeiro/fluxo-caixa':
      return { buckets: [], itens: [], entradasPrevistas: 0, saidasPrevistas: 0, saldoFinal: 0 }
    default:
      return []
  }
}

async function mockApi(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const method = route.request().method()
    const body = method === 'GET' ? bodyFor(route.request().url()) : {}
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

test.describe('Responsivo - rotas públicas', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`sem scroll horizontal em 390px: ${route}`, async ({ page }) => {
      await mockApi(page)
      await page.goto(route)
      await page.waitForTimeout(800)
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
    })
  }
})

test.describe('Responsivo - módulos admin', () => {
  for (const route of ADMIN_ROUTES) {
    test(`sem scroll horizontal em 390px: ${route}`, async ({ page }) => {
      await seedAdminAuth(page)
      await mockApi(page)
      await page.goto(route)
      await page.waitForTimeout(1200)
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
    })
  }
})

test.describe('Shell de navegação mobile', () => {
  test('mostra a navegação inferior e esconde a sidebar', async ({ page }) => {
    await seedAdminAuth(page)
    await mockApi(page)
    await page.goto('/dashboard')
    await page.waitForTimeout(1200)

    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
  })

  test('abre o menu (launcher) pelo rodapé e expõe todos os módulos', async ({ page }) => {
    await seedAdminAuth(page)
    await mockApi(page)
    await page.goto('/dashboard')
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: 'Abrir menu completo' }).click()

    await expect(page.getByRole('dialog', { name: 'Menu de navegação' })).toBeVisible()

    for (const label of [
      'Pacotes',
      'Comissões',
      'Analytics',
      'Configurações',
      'Receitas',
      'Despesas',
      'Fluxo de Caixa',
      'Relatórios',
      'Repasses Pendentes',
    ]) {
      await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible()
    }

    await page.waitForTimeout(400)
    await expect(page.getByRole('dialog', { name: 'Menu de navegação' })).toBeVisible()
  })

  test('abre o menu pelo botão do cabeçalho (topo)', async ({ page }) => {
    await seedAdminAuth(page)
    await mockApi(page)
    await page.goto('/dashboard')
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Menu de navegação' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pacotes', exact: true })).toBeVisible()
  })

  test('cria pacote a partir do telefone (menu -> Pacotes -> Novo Pacote)', async ({ page }) => {
    await seedAdminAuth(page)
    await mockApi(page)
    await page.goto('/dashboard')
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: 'Abrir menu completo' }).click()
    await page.getByRole('link', { name: 'Pacotes', exact: true }).click()

    await expect(page).toHaveURL(/\/pacotes$/)
    const novoPacote = page.getByRole('button', { name: /Novo Pacote/i })
    await expect(novoPacote).toBeVisible()

    await novoPacote.click()
    await expect(page).toHaveURL(/\/pacotes\/novo$/)
    await expect(page.getByLabel('Nome do Pacote *')).toBeVisible()
  })

  test('menu funciona em paisagem (844x390)', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await seedAdminAuth(page)
    await mockApi(page)
    await page.goto('/dashboard')
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: 'Abrir menu completo' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu de navegação' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pacotes', exact: true })).toBeVisible()
  })
})

test.describe('Página pública da proposta (/proposta/:token)', () => {
  for (const width of [390, 768]) {
    test(`sem scroll horizontal em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await mockApi(page)
      await page.goto('/proposta/test-token')
      await page.waitForTimeout(800)
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
    })
  }

  test('mostra o fluxo de confirmação em 3 passos, sem campo de assinatura', async ({ page }) => {
    await mockApi(page)
    await page.goto('/proposta/test-token')
    await page.waitForTimeout(800)

    await expect(page.getByRole('button', { name: 'Confirmar e enviar' })).toBeVisible()
    await expect(page.getByText('Assinatura digital')).toHaveCount(0)
    await expect(page.getByText('Confirmação (digite seu nome completo)')).toHaveCount(0)
  })
})

test.describe('Alvos de toque e larguras estreitas', () => {
  test('itens da navegação inferior têm alvo >= 44px', async ({ page }) => {
    await seedAdminAuth(page)
    await mockApi(page)
    await page.goto('/dashboard')
    await page.waitForTimeout(1200)

    const nav = page.getByRole('navigation', { name: 'Navegação principal' })
    const items = nav.getByRole('link')
    const total = await items.count()
    expect(total).toBeGreaterThan(0)
    for (let i = 0; i < total; i++) {
      const box = await items.nth(i).boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    }
  })

  for (const route of ['/pacotes', '/agenda', '/financeiro', '/admin/ecommerce']) {
    test(`sem scroll horizontal em 360px: ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 })
      await seedAdminAuth(page)
      await mockApi(page)
      await page.goto(route)
      await page.waitForTimeout(1200)
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
    })
  }
})
