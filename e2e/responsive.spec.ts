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
  '/agenda/avulso',
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

test.describe('Agenda - tarja colorida por pacote', () => {
  test('nome de cliente longo é truncado sem vazar da tarja (768px)', async ({ page }) => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const dataHoje = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T10:00:00`

    const agendamentoLongo = {
      id: 'e2e-color-1',
      clienteId: 'e2e-cliente-1',
      clienteNome: 'Fernanda Albuquerque da Silva Sauro',
      clienteTelefone: null,
      clienteEmail: null,
      clienteCpf: null,
      clienteCidade: null,
      clienteEstado: null,
      pacoteId: 'e2e-pacote-1',
      pacoteNome: 'Pacote Casamento Completo Premium',
      pacoteCor: '#F9A8D4',
      editorId: null,
      editorNome: null,
      fotografoId: null,
      fotografoNome: null,
      fotografos: null,
      dataHoraEnsaio: dataHoje,
      duracaoMinutos: 60,
      localEnsaio: 'Estúdio Central',
      valorTotal: 1000,
      valorEntradaExigido: 300,
      valorEntradaPago: 0,
      valorRestante: 700,
      valorExtras: 0,
      taxaDeslocamento: 0,
      valorTotalFinal: 1000,
      percentualEntrada: 30,
      valorPacote: 1000,
      saldoDevedor: 1000,
      status: 'CONFIRMADO',
      autorizaUsoImagem: false,
      ensaioDestaque: false,
      observacoes: null,
      createdAt: '',
      updatedAt: '',
    }

    await page.setViewportSize({ width: 768, height: 900 })
    await seedAdminAuth(page)
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url()
      const path = url.split('/api/v1')[1]?.split('?')[0] ?? ''
      const isGet = route.request().method() === 'GET'
      const body = isGet && path === '/agendamentos' ? [agendamentoLongo] : isGet ? bodyFor(url) : {}
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    })
    await page.goto('/agenda')
    await page.waitForTimeout(1200)

    const pill = page.getByTestId('agenda-calendar-event').first()
    await expect(pill).toBeVisible()

    const overflowInterno = await pill.evaluate((el) => el.scrollWidth - el.clientWidth)
    expect(overflowInterno).toBeLessThanOrEqual(1)
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
  })
})

const AGENDAMENTO_HOJE = {
  id: 'e2e-agenda-1',
  clienteId: 'e2e-cliente-1',
  clienteNome: 'Maria Souza',
  clienteTelefone: null,
  clienteEmail: null,
  clienteCpf: null,
  clienteCidade: null,
  clienteEstado: null,
  pacoteId: 'e2e-pacote-1',
  pacoteNome: 'Ensaio Praia',
  pacoteCor: '#3B82F6',
  editorId: null,
  editorNome: null,
  fotografoId: null,
  fotografoNome: null,
  fotografos: null,
  dataHoraEnsaio: new Date().toISOString().slice(0, 19),
  duracaoMinutos: 60,
  localEnsaio: 'Estúdio Central',
  valorTotal: 900,
  valorEntradaExigido: 270,
  valorEntradaPago: 0,
  valorRestante: 630,
  valorExtras: 0,
  taxaDeslocamento: 0,
  valorTotalFinal: 900,
  percentualEntrada: 30,
  valorPacote: 900,
  saldoDevedor: 900,
  status: 'CONFIRMADO',
  autorizaUsoImagem: false,
  ensaioDestaque: false,
  observacoes: null,
  createdAt: '',
  updatedAt: '',
}

async function mockAgendaApi(page: Page, agendamentos: unknown[]) {
  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url()
    const path = url.split('/api/v1')[1]?.split('?')[0] ?? ''
    const isGet = route.request().method() === 'GET'
    const body = isGet && path === '/agendamentos' ? agendamentos : isGet ? bodyFor(url) : {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

test.describe('Agenda - visual Google Calendar (mobile)', () => {
  test('visão de mês mobile sem scroll horizontal (390px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedAdminAuth(page)
    await mockAgendaApi(page, [AGENDAMENTO_HOJE])
    await page.goto('/agenda')
    await page.waitForTimeout(1200)

    await expect(page.getByTestId('agenda-calendar-event').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Abrir opções da agenda' })).toBeVisible()
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
  })

  test('agenda sem overflow em telas estreitas e tablet/landscape', async ({ page }) => {
    await seedAdminAuth(page)
    await mockAgendaApi(page, [AGENDAMENTO_HOJE])

    for (const viewport of [
      { width: 320, height: 720 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/agenda')
      await page.waitForTimeout(600)

      await expect(page.getByTestId('agenda-calendar-event').first()).toBeVisible()
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
      const mainOverflow = await page
        .locator('#main-content')
        .evaluate((el) => el.scrollWidth - el.clientWidth)
      expect(mainOverflow).toBeLessThanOrEqual(1)
    }
  })

  test('hambúrguer abre o drawer de opções da agenda', async ({ page }) => {
    await seedAdminAuth(page)
    await mockAgendaApi(page, [AGENDAMENTO_HOJE])
    await page.goto('/agenda')
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: 'Abrir opções da agenda' }).click()

    const drawer = page.getByRole('dialog', { name: 'Opções da agenda' })
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('button', { name: 'Ir para hoje' })).toBeVisible()
    await expect(drawer.getByRole('button', { name: 'Mês' })).toBeVisible()

    await drawer.getByRole('button', { name: 'Lista' }).click()
    await drawer.getByRole('button', { name: 'Fechar opções' }).click()
    await expect(drawer).not.toBeVisible()
  })

  test('FAB cria nova proposta', async ({ page }) => {
    await seedAdminAuth(page)
    await mockAgendaApi(page, [])
    await page.goto('/agenda')
    await page.waitForTimeout(1200)

    const fab = page.getByTestId('agenda-fab')
    await expect(fab).toBeVisible()
    await fab.click()
    await expect(page).toHaveURL(/\/propostas\/nova/)
  })

  test('não exibe busca de cliente no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedAdminAuth(page)
    await mockAgendaApi(page, [AGENDAMENTO_HOJE])
    await page.goto('/agenda')
    await page.waitForTimeout(1200)

    await expect(page.getByRole('button', { name: 'Buscar cliente' })).toHaveCount(0)
    await expect(page.getByPlaceholder('Buscar cliente...')).toHaveCount(0)
  })

  test('não exibe filtro por editor no drawer mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedAdminAuth(page)
    await mockAgendaApi(page, [AGENDAMENTO_HOJE])
    await page.goto('/agenda')
    await page.waitForTimeout(1200)

    await page.getByRole('button', { name: 'Abrir opções da agenda' }).click()
    const drawer = page.getByRole('dialog', { name: 'Opções da agenda' })
    await expect(drawer).toBeVisible()
    await expect(drawer.getByText('Editor', { exact: true })).toHaveCount(0)
  })
})

test.describe('Agendamento detalhes responsivo', () => {
  const CLIENTE_DETALHE = {
    id: 'e2e-cliente-1',
    nome: 'Maria Souza',
    telefone: '(11) 99999-9999',
    email: 'maria@exemplo.com',
    cpf: '123.456.789-00',
    cidade: 'São Paulo',
    estado: 'SP',
    origem: 'INDICACAO',
    observacoes: 'Cliente de teste',
  }

  const RESUMO_FINANCEIRO = {
    statusPagamento: 'PENDENTE',
    clienteNome: 'Maria Souza',
    valorCobrado: 900,
    totalRecebido: 0,
    saldoDevedor: 900,
    custoTotal: 0,
    totalDespesas: 0,
    custoDeslocamento: 0,
    comissao: 0,
    lucroBruto: 900,
    margemLucro: 100,
    valorPartilhaGlobal: null,
    fotografos: [],
    custosFotografo: [],
    despesas: [],
  }

  async function mockDetalheApi(page: Page) {
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url()
      const path = url.split('/api/v1')[1]?.split('?')[0] ?? ''
      const method = route.request().method()
      const isGet = method === 'GET'
      const body = isGet && path === '/agendamentos/e2e-agenda-1'
        ? AGENDAMENTO_HOJE
        : isGet && path === '/agendamentos/e2e-agenda-1/reatribuicoes'
          ? []
          : isGet && path === '/clientes/e2e-cliente-1'
            ? CLIENTE_DETALHE
            : isGet && path === '/financeiro/agendamentos/e2e-agenda-1/financeiro'
              ? RESUMO_FINANCEIRO
              : isGet && path === '/financeiro/agendamentos/e2e-agenda-1/pagamentos'
                ? []
                : isGet && path.includes('disponibilidade')
                  ? { disponivel: true, conflitos: [], bloqueios: [] }
                  : isGet
                    ? bodyFor(url)
                    : path === '/clientes/e2e-cliente-1'
                      ? CLIENTE_DETALHE
                      : {}
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    })
  }

  async function mainOverflow(page: Page): Promise<number> {
    return page.locator('#main-content').evaluate((el) => el.scrollWidth - el.clientWidth)
  }

  test('detalhes sem overflow em celular e tablet/landscape', async ({ page }) => {
    await seedAdminAuth(page)
    await mockDetalheApi(page)

    for (const viewport of [
      { width: 320, height: 720 },
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 844, height: 390 },
      { width: 1024, height: 768 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/agenda/e2e-agenda-1')

      await expect(page.getByRole('tab', { name: 'Resumo' })).toBeVisible()
      await expect(page.getByText('Dados do Cliente')).toBeVisible()
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
      expect(await mainOverflow(page)).toBeLessThanOrEqual(1)

      await page.getByRole('tab', { name: 'Financeiro' }).click()
      await expect(page.getByText('Detalhamento Financeiro')).toBeVisible()
      expect(await mainOverflow(page)).toBeLessThanOrEqual(1)

      await page.getByRole('tab', { name: 'Contrato' }).click()
      await expect(page.getByText('Resumo para WhatsApp')).toBeVisible()
      expect(await mainOverflow(page)).toBeLessThanOrEqual(1)
    }
  })

  test('oculta a Linha do Tempo no layout mobile/tablet e mantém no desktop', async ({ page }) => {
    await seedAdminAuth(page)
    await mockDetalheApi(page)

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/agenda/e2e-agenda-1')
      await expect(page.getByRole('tab', { name: 'Linha do Tempo' })).toHaveCount(0)
    }

    await page.setViewportSize({ width: 1024, height: 768 })
    await page.reload()
    await expect(page.getByRole('tab', { name: 'Linha do Tempo' })).toBeVisible()
  })

  test('edição de cliente abre em bottom sheet sem overflow e cancela sem navegar', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await seedAdminAuth(page)
    await mockDetalheApi(page)
    await page.goto('/agenda/e2e-agenda-1')

    await page.getByRole('button', { name: 'Editar Cliente' }).click()
    const dialog = page.getByRole('dialog', { name: 'Editar Cliente' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Nome *')).toBeVisible()
    await expect(dialog.getByLabel('Telefone *')).toBeVisible()
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)

    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page).toHaveURL(/\/agenda\/e2e-agenda-1$/)
  })

  test('edição do agendamento sem overflow no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await seedAdminAuth(page)
    await mockDetalheApi(page)
    await page.goto('/agenda/e2e-agenda-1/editar')

    await expect(page.getByRole('heading', { name: 'Editar Agendamento' })).toBeVisible()
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
    expect(await mainOverflow(page)).toBeLessThanOrEqual(1)
  })

  test('barra de ações fica fixa acima da navegação inferior', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedAdminAuth(page)
    await mockDetalheApi(page)
    await page.goto('/agenda/e2e-agenda-1')

    const bar = page.getByTestId('sticky-action-bar')
    const nav = page.getByRole('navigation', { name: 'Navegação principal' })
    await expect(bar).toBeVisible()
    await expect(nav).toBeVisible()

    expect(await bar.evaluate((el) => getComputedStyle(el).position)).toBe('fixed')

    const barBox = await bar.boundingBox()
    const navBox = await nav.boundingBox()
    expect(barBox).not.toBeNull()
    expect(navBox).not.toBeNull()
    expect(barBox!.y + barBox!.height).toBeLessThanOrEqual(navBox!.y + 1)
  })
})

test.describe('Seletor de horário', () => {
  test('proposta abre sheet com horários dentro da viewport mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedAdminAuth(page)
    await mockApi(page)
    await page.goto('/propostas/nova')

    const trigger = page.getByRole('button', { name: 'Horário *' })
    await expect(trigger).toBeVisible()
    await trigger.click()

    const sheet = page.getByRole('dialog', { name: 'Horário do ensaio' })
    await expect(sheet).toBeVisible()

    const box = await sheet.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(844 + 1)

    const chips = page.getByRole('radio')
    const total = await chips.count()
    expect(total).toBeGreaterThan(0)
    for (let i = 0; i < total; i++) {
      const chipBox = await chips.nth(i).boundingBox()
      expect(chipBox?.height ?? 0).toBeGreaterThanOrEqual(44)
    }

    await chips.filter({ hasText: '09:00' }).click()
    await expect(sheet).not.toBeVisible()
    await expect(trigger).toContainText('09:00')
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
  })

  test('proposta mantém o popover dentro da viewport no desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await seedAdminAuth(page)
    await mockApi(page)
    await page.goto('/propostas/nova')

    await page.getByRole('button', { name: 'Horário *' }).click()
    const popover = page.locator('[data-radix-popper-content-wrapper]')
    await expect(popover).toBeVisible()

    const box = await popover.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(800 + 1)
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
  })

  test('edição de agendamento abre sheet com horários', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedAdminAuth(page)
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url()
      const path = url.split('/api/v1')[1]?.split('?')[0] ?? ''
      const isGet = route.request().method() === 'GET'
      const body = isGet && path === '/agendamentos/e2e-agenda-1'
        ? AGENDAMENTO_HOJE
        : isGet && path.includes('disponibilidade')
          ? { disponivel: true, conflitos: [], bloqueios: [] }
          : isGet
            ? bodyFor(url)
            : {}
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    })
    await page.goto('/agenda/e2e-agenda-1/editar')

    const trigger = page.getByRole('button', { name: 'Horário *' })
    await expect(trigger).toBeVisible()
    await trigger.click()

    const sheet = page.getByRole('dialog', { name: 'Horário do ensaio' })
    await expect(sheet).toBeVisible()
    await page.getByRole('radio', { name: '11:00' }).click()
    await expect(sheet).not.toBeVisible()
    await expect(trigger).toContainText('11:00')
  })

  test('compromisso aceita horário personalizado além dos chips', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedAdminAuth(page)
    await mockAgendaApi(page, [])
    await page.goto('/agenda')

    await page.getByRole('button', { name: /Novo compromisso/ }).click()
    await page.getByRole('button', { name: 'Hora de início' }).click()

    const sheet = page.getByRole('dialog', { name: 'Hora de início' })
    await expect(sheet).toBeVisible()
    await page.getByLabel('Horário personalizado').fill('23:45')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(sheet).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Hora de início' })).toContainText('23:45')

    await page.getByRole('button', { name: 'Hora de fim' }).click()
    await expect(page.getByRole('dialog', { name: 'Hora de fim' })).toBeVisible()
    await page.getByRole('radio', { name: '18:00' }).click()
    await expect(page.getByRole('button', { name: 'Hora de fim' })).toContainText('18:00')
  })
})

test.describe('Agendamento avulso', () => {
  const PACOTE_AVULSO = {
    id: 'pacote-avulso-1',
    nome: 'Ensaio Praia',
    descricao: 'Ensaio na praia',
    quantidadeFotos: 30,
    quantidadeVideos: 0,
    valorBase: 900,
    cor: '#3B82F6',
    bloqueiaDiaInteiro: false,
    duracaoEstimada: '1h',
    ativo: true,
  }

  const OPCOES_AVULSO = {
    fotografos: [{ id: 'foto-1', nome: 'Foto Teste' }],
    editores: [],
    percentualEntrada: 30,
    taxaDeslocamentoPadrao: 0,
  }

  function futuro(): { dia: string; mesAno: string } {
    const data = new Date()
    data.setDate(data.getDate() + 5)
    return {
      dia: String(data.getDate()),
      mesAno: new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(data),
    }
  }

  test('admin cria agendamento avulso com cliente, valores e recebimento', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedAdminAuth(page)
    let payload: Record<string, unknown> | null = null

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url()
      const path = url.split('/api/v1')[1]?.split('?')[0] ?? ''
      const method = route.request().method()
      let body: unknown = method === 'GET' ? bodyFor(url) : {}

      if (path === '/pacotes/all') body = [PACOTE_AVULSO]
      if (path === '/agendamentos/avulso/opcoes') body = OPCOES_AVULSO
      if (path === '/agendamentos/verificar-disponibilidade') {
        body = { disponivel: true, conflitos: [], bloqueios: [] }
      }
      if (method === 'POST' && path === '/agendamentos/avulso') {
        payload = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>
        body = { id: 'avulso-1', status: 'CONFIRMADO', origem: 'AVULSO' }
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    })

    await page.goto('/agenda/avulso')
    await expect(page.getByRole('heading', { name: 'Agendamento Avulso' })).toBeVisible()
    await expect(page.getByLabel('Editor responsável')).toHaveCount(0)
    await expect(page.getByLabel('Origem')).toHaveCount(0)
    await expect(page.getByLabel('Referência externa')).toHaveCount(0)

    await page.getByLabel('Nome completo *').fill('Maria Souza')
    await page.getByLabel('Telefone *').fill('11999999999')
    await page.getByLabel('CPF').fill('12345678900')

    await page.getByLabel('Pacote *').click()
    await page.getByRole('option', { name: /Ensaio Praia/ }).click()

    await page.getByRole('button', { name: /Selecione a data/ }).click()
    const { dia } = futuro()
    await page.locator('[role="gridcell"] button').filter({ hasText: new RegExp(`^${dia}$`) }).first().click()

    await page.getByRole('button', { name: 'Horário *' }).click()
    await page.getByRole('radio', { name: '09:00' }).click()

    await page.getByLabel('Local do ensaio *').fill('Praia de Copacabana')
    await page.getByLabel('Fotógrafo responsável *').click()
    await page.getByRole('option', { name: 'Foto Teste' }).click()

    await page.getByLabel('Valor recebido agora (R$)').fill('300,00')
    await page.getByRole('button', { name: 'Salvar agendamento' }).click()

    await expect(page).toHaveURL(/\/agenda\/avulso-1/)
    expect(payload).not.toBeNull()
    expect(payload!.clienteNome).toBe('Maria Souza')
    expect(payload!.clienteTelefone).toBe('(11) 99999-9999')
    expect(payload!.pacoteId).toBe('pacote-avulso-1')
    expect(payload!.fotografoId).toBe('foto-1')
    expect(payload!.valorPago).toBe(300)
    expect(payload!.duracaoMinutos).toBe(60)
    expect(String(payload!.dataHoraEnsaio)).toMatch(/T09:00:00$/)
  })

  test('agendador acessa o formulário de agendamento avulso', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('photoizer_auth_token', 'e2e-test-token')
      window.localStorage.setItem('photoizer_auth_user', JSON.stringify({
        nome: 'Agendador Teste',
        email: 'agendador@teste.com',
        papel: 'AGENDADOR',
        userId: '2',
      }))
    })
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url()
      const path = url.split('/api/v1')[1]?.split('?')[0] ?? ''
      const body = path === '/auth/me'
        ? { nome: 'Agendador Teste', email: 'agendador@teste.com', papel: 'AGENDADOR', userId: '2' }
        : path === '/pacotes/all'
          ? [PACOTE_AVULSO]
          : path === '/agendamentos/avulso/opcoes'
            ? OPCOES_AVULSO
            : path === '/notificacoes'
              ? { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 }
              : []
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    })
    await page.goto('/agenda/avulso')
    await expect(page.getByRole('heading', { name: 'Agendamento Avulso' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Salvar agendamento' })).toBeVisible()
  })
})
