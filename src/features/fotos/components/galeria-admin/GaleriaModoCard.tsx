import { useState } from 'react'
import { Check, Loader2, PencilRuler, ShieldCheck } from 'lucide-react'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { useAlterarModoGaleria } from '../../api/queries'
import { cn } from '@/shared/lib/cn'
import type { GaleriaEnsaioResponse, ModoGaleria } from '@/features/ecommerce/types/ecommerce.types'

interface OpcaoModo {
  valor: ModoGaleria
  titulo: string
  descricao: string
  detalhe: string
  icone: typeof PencilRuler
}

const OPCOES: OpcaoModo[] = [
  {
    valor: 'COM_EDICAO',
    titulo: 'Edição após a seleção',
    descricao: 'O cliente escolhe as fotos, o estúdio edita e publica a versão final antes da entrega.',
    detalhe: 'Mais controle de qualidade; a entrega acontece depois da edição.',
    icone: PencilRuler,
  },
  {
    valor: 'SEM_EDICAO',
    titulo: 'Seleção com edição',
    descricao: 'O staff apenas aprova a seleção do cliente e libera a entrega.',
    detalhe: 'Sem etapa de edição após a escolha; as fotos do pacote saem na versão original.',
    icone: ShieldCheck,
  },
]

interface GaleriaModoCardProps {
  galeria: GaleriaEnsaioResponse
  podeEditar: boolean
}

export function GaleriaModoCard({ galeria, podeEditar }: GaleriaModoCardProps) {
  const [modoPendente, setModoPendente] = useState<ModoGaleria | null>(null)
  const { mutate: alterarModo, isPending } = useAlterarModoGaleria(galeria.agendamentoId)

  const selecionado = galeria.modo
  const bloqueado = !podeEditar || !galeria.podeAlterarModo || isPending
  const legado = selecionado === 'DIRETO'

  const selecionar = (modo: ModoGaleria) => {
    if (bloqueado || modo === selecionado) return
    setModoPendente(modo)
  }

  const confirmar = () => {
    if (!modoPendente) return
    alterarModo(modoPendente, {
      onSuccess: () => setModoPendente(null),
      onError: () => setModoPendente(null),
    })
  }

  const opcaoPendente = OPCOES.find((opcao) => opcao.valor === modoPendente)

  return (
    <section className="flex flex-col rounded-xl border bg-card p-4" aria-labelledby="galeria-modo-titulo">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-violet-100 p-2 text-violet-700">
          <PencilRuler className="h-4 w-4" />
        </div>
        <div>
          <h3 id="galeria-modo-titulo" className="text-sm font-semibold">Fluxo de entrega</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Define o que acontece depois que o cliente envia a seleção.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {OPCOES.map((opcao) => {
          const Icone = opcao.icone
          const ativo = selecionado === opcao.valor
          return (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => selecionar(opcao.valor)}
              disabled={bloqueado}
              aria-pressed={ativo}
              className={cn(
                'relative flex h-full flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                ativo
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/60',
                bloqueado && !ativo && 'cursor-not-allowed opacity-60',
                bloqueado && ativo && 'cursor-default',
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icone className="h-4 w-4 shrink-0" />
                {opcao.titulo}
                {ativo && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <Check className="h-3 w-3" />
                    Atual
                  </span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">{opcao.descricao}</span>
              <span className="text-[11px] text-muted-foreground/80">{opcao.detalhe}</span>
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        {legado
          ? 'Esta galeria usa o fluxo legado (desativado) até ser migrada.'
          : !podeEditar
            ? 'Somente administradores podem alterar o fluxo de entrega.'
            : !galeria.podeAlterarModo
              ? 'Não pode ser alterado após seleção, venda ou edição.'
              : 'A alteração é confirmada antes de ser aplicada.'}
      </p>

      {isPending && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Atualizando fluxo…
        </p>
      )}

      <ConfirmDialog
        open={modoPendente !== null}
        onOpenChange={(aberto) => { if (!aberto) setModoPendente(null) }}
        onConfirm={confirmar}
        isLoading={isPending}
        title="Alterar fluxo de entrega?"
        description={`A galeria passará a usar "${opcaoPendente?.titulo ?? ''}". ${opcaoPendente?.descricao ?? ''}`}
        confirmText="Alterar fluxo"
      >
        {opcaoPendente && (
          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            {opcaoPendente.detalhe}
          </div>
        )}
      </ConfirmDialog>
    </section>
  )
}
