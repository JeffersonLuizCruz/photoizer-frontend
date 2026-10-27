import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { humanizarNome } from '@/shared/lib/foto'
import { useAtualizarTituloGaleria } from '../../api/queries'
import { heroTituloSchema, type HeroTituloFormValues } from '../../schemas/galeria.schema'

interface GaleriaHeroTituloCardProps {
  agendamentoId: string
  tituloAtual: string | null
  clienteNome: string | null | undefined
}

/**
 * Texto customizado exibido no hero da galeria pública.
 *
 * Vazio/null volta a exibir o nome do cliente. O texto é salvo por galeria e
 * não depende do modo ou da fase.
 */
export function GaleriaHeroTituloCard({
  agendamentoId,
  tituloAtual,
  clienteNome,
}: GaleriaHeroTituloCardProps) {
  const { mutate, isPending } = useAtualizarTituloGaleria(agendamentoId)
  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } =
    useForm<HeroTituloFormValues>({
      resolver: zodResolver(heroTituloSchema) as never,
      defaultValues: { tituloHero: tituloAtual ?? '' },
    })

  useEffect(() => {
    reset({ tituloHero: tituloAtual ?? '' })
  }, [tituloAtual, reset])

  const valor = watch('tituloHero') ?? ''
  const nomeCliente = humanizarNome(clienteNome)
  const preview = valor.trim() || nomeCliente || 'Sua galeria'

  const salvar = (values: HeroTituloFormValues) => {
    mutate(values.tituloHero.trim() || null)
  }

  const usarNomeCliente = () => {
    mutate(null, { onSuccess: () => reset({ tituloHero: '' }) })
  }

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-sky-100 p-2 text-sky-700">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Texto do hero</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Título exibido no topo da galeria do cliente.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(salvar)} className="mt-3 space-y-2">
        <Label htmlFor="galeria-hero-titulo">Título</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="galeria-hero-titulo"
            maxLength={120}
            placeholder={nomeCliente || 'Sua galeria'}
            {...register('tituloHero')}
          />
          <Button type="submit" disabled={isPending || !isDirty} className="shrink-0">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={usarNomeCliente}
            disabled={isPending || (!tituloAtual && !valor)}
            className="shrink-0"
          >
            Usar nome do cliente
          </Button>
        </div>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            {errors.tituloHero?.message
              ?? 'Deixe em branco para exibir o nome do cliente.'}
          </p>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {valor.length}/120
          </span>
        </div>
      </form>

      <div className="mt-3 rounded-lg border bg-muted/30 px-3 py-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Prévia
        </p>
        <p className="mt-1 truncate font-display text-lg uppercase tracking-[0.04em]">
          {preview}
        </p>
      </div>
    </section>
  )
}
