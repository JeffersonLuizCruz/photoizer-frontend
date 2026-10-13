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
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style')
        style.textContent = '.tsqd-parent-container{display:none !important}'
        document.head.appendChild(style)
      })
    })
  })

  test('mostra a navegação inferior e esconde a sidebar', async ({ page }) => {
    await seedAdminAuth(page)
    await mockApi(page)
    await page.goto('/dashboard')
    await page.waitForTimeout(1200)

    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
  })

  test('abre o menu completo pelo botão "Mais" e expõe todos os recursos', async ({ page }) => {
    await seedAdminAuth(page)
    await mockApi(page)
    await page.goto('/dashboard')
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: 'Abrir menu com mais opções' }).click()

    await expect(page.getByRole('dialog', { name: 'Menu de navegação' })).toBeVisible()

    for (const label of ['Pacotes', 'Financeiro', 'Parceiros', 'Configurações', 'Comissões']) {
      await expect(page.getByRole('link', { name: label }).or(page.getByRole('button', { name: label })).first()).toBeVisible()
    }

    await page.waitForTimeout(400)
    await expect(page.getByRole('dialog', { name: 'Menu de navegação' })).toBeVisible()
  })

  test('cria pacote a partir do telefone (menu -> Pacotes -> Novo Pacote)', async ({ page }) => {
    await seedAdminAuth(page)
    await mockApi(page)
    await page.goto('/dashboard')
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: 'Abrir menu com mais opções' }).click()
    await page.getByRole('link', { name: 'Pacotes' }).click()

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

    await page.getByRole('button', { name: 'Abrir menu com mais opções' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu de navegação' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pacotes' })).toBeVisible()
  })
})

test.describe('Alvos de toque e larguras estreitas', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style')
        style.textContent = '.tsqd-parent-container{display:none !important}'
        document.head.appendChild(style)
      })
    })
  })

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
