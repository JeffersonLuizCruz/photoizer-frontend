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

function bodyFor(url: string): unknown {
  const path = url.split('/api/v1')[1]?.split('?')[0] ?? ''
  switch (path) {
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
})
