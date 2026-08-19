import type { ElementType } from 'react'
import {
  ArrowDownLeft,
  Calendar,
  Camera,
  DollarSign,
  FileBarChart2,
  FileSignature,
  HandCoins,
  Image,
  LayoutDashboard,
  Package,
  Percent,
  ReceiptText,
  Settings,
  ShoppingCart,
  Wallet,
} from 'lucide-react'
import { ROUTES } from '@/shared/constants'
import type { Papel } from '@/features/auth/AuthProvider'

export interface NavItem {
  to: string
  label: string
  icon: ElementType
  end?: boolean
}

export interface NavGroup {
  label: string
  icon: ElementType
  children: NavItem[]
}

export type NavEntry = NavItem | NavGroup

const financeiroGroup: NavGroup = {
  label: 'Financeiro',
  icon: DollarSign,
  children: [
    { to: ROUTES.FINANCEIRO, label: 'Visão geral', icon: LayoutDashboard, end: true },
    { to: ROUTES.FINANCEIRO_RECEITAS, label: 'Receitas', icon: ReceiptText },
    { to: ROUTES.FINANCEIRO_DESPESAS, label: 'Despesas', icon: ArrowDownLeft },
    { to: ROUTES.FINANCEIRO_FLUXO_CAIXA, label: 'Fluxo de Caixa', icon: Wallet },
    { to: ROUTES.FINANCEIRO_RELATORIOS, label: 'Relatórios', icon: FileBarChart2 },
  ],
}

const fotografosGroup: NavGroup = {
  label: 'Parceiros',
  icon: Camera,
  children: [
    { to: ROUTES.FOTOGRAFOS, label: 'Lista', icon: Camera },
    { to: ROUTES.FOTOGRAFOS_RELATORIO, label: 'Relatório Global', icon: FileBarChart2 },
    { to: ROUTES.REPASSES_PENDENTES, label: 'Repasses Pendentes', icon: HandCoins },
  ],
}

const navEntries: NavEntry[] = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.AGENDA, label: 'Agenda', icon: Calendar },
  { to: ROUTES.PACOTES, label: 'Pacotes', icon: Package },
  { to: ROUTES.EDICAO, label: 'Edição', icon: Image },
  { to: ROUTES.ADMIN_ECOMMERCE, label: 'Ecommerce', icon: ShoppingCart },
  { to: ROUTES.CONTRATOS, label: 'Contratos', icon: FileSignature },
  { to: ROUTES.COMISSOES, label: 'Comissões', icon: Percent },
  financeiroGroup,
  fotografosGroup,
  { to: ROUTES.CONFIG, label: 'Configurações', icon: Settings },
]

const fotografoEntries: NavEntry[] = [
  { to: ROUTES.MEU_PAINEL, label: 'Meu Painel', icon: LayoutDashboard, end: true },
  { to: ROUTES.MINHA_AGENDA, label: 'Minha Agenda', icon: Calendar },
  { to: ROUTES.MINHAS_FINANCAS, label: 'Minhas Finanças', icon: DollarSign },
]

const allowedRoutesByPapel: Record<string, Set<string>> = {
  AGENDADOR: new Set([
    ROUTES.AGENDA,
    ROUTES.PACOTES,
    ROUTES.EDICAO,
    ROUTES.COMISSOES,
    ROUTES.CONTRATOS,
    ROUTES.CONFIG,
  ]),
}

export function isNavItem(entry: NavEntry): entry is NavItem {
  return 'to' in entry
}

export function getVisibleEntries(papel: Papel | null): NavEntry[] {
  if (!papel) return []

  if (papel === 'FOTOGRAFO') {
    return fotografoEntries
  }

  const base =
    papel in allowedRoutesByPapel
      ? navEntries.filter((entry) =>
          isNavItem(entry)
            ? allowedRoutesByPapel[papel].has(entry.to)
            : entry.children.some((child) => allowedRoutesByPapel[papel].has(child.to)),
        )
      : navEntries

  // Parceiro (FOTOGRAFO/EDITOR/AGENDADOR) também acessa o autoatendimento (Minhas Finanças, Meu Painel, Minha Agenda)
  if (papel === 'EDITOR' || papel === 'AGENDADOR') {
    return [...fotografoEntries, ...base]
  }

  return base
}

export interface MobileTab {
  to: string
  label: string
  icon: ElementType
  end?: boolean
}

const mobilePriority: MobileTab[] = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.AGENDA, label: 'Agenda', icon: Calendar },
  { to: ROUTES.CONTRATOS, label: 'Contratos', icon: FileSignature },
  { to: ROUTES.ADMIN_ECOMMERCE, label: 'Ecommerce', icon: ShoppingCart },
  { to: ROUTES.PACOTES, label: 'Pacotes', icon: Package },
  { to: ROUTES.EDICAO, label: 'Edição', icon: Image },
  { to: ROUTES.COMISSOES, label: 'Comissões', icon: Percent },
  { to: ROUTES.CONFIG, label: 'Configurações', icon: Settings },
]

const fotografoMobileTabs: MobileTab[] = [
  { to: ROUTES.MEU_PAINEL, label: 'Meu Painel', icon: LayoutDashboard, end: true },
  { to: ROUTES.MINHA_AGENDA, label: 'Minha Agenda', icon: Calendar },
  { to: ROUTES.MINHAS_FINANCAS, label: 'Minhas Finanças', icon: DollarSign },
]

export function getMobileTabs(papel: Papel | null): MobileTab[] {
  if (!papel) return []

  if (papel === 'FOTOGRAFO') {
    return [...fotografoMobileTabs]
  }

  const allowed = allowedRoutesByPapel[papel]
  return mobilePriority
    .filter((tab) => !allowed || allowed.has(tab.to))
    .slice(0, 4)
}