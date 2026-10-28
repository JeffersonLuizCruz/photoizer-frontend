import { useEffect, useState } from 'react'
import { Image, Lock } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useAplicarQualidadeGaleria } from '../../api/queries'
import type { QualidadePreview } from '@/features/ecommerce/types/ecommerce.types'

interface GaleriaQualidadePreviewCardProps {
  agendamentoId: string
  qualidadeAtual: QualidadePreview
  arquivada: boolean
  podeEditar: boolean
}

const LABEL: Record<QualidadePreview, string> = {
  PROTEGIDA: 'Protegida (800px)',
  EQUILIBRADA: 'Equilibrada (1600px)',
  ORIGINAL: 'Original',
}

const DESCRICAO: Record<QualidadePreview, string> = {
  PROTEGIDA: 'Menor consumo de banda e maior proteção contra uso indevido.',
  EQUILIBRADA: 'Boa nitidez em celular e desktop, com consumo moderado.',
  ORIGINAL: 'Máxima fidelidade. Maior consumo de armazenamento e banda.',
}

/**
 * Política de qualidade das prévias da galeria.
 *
 * O padrão é ORIGINAL; reduzir a qualidade é uma decisão explícita do ADMIN.
 * O download do cliente continua sempre no arquivo original/editado final.
 */
export function GaleriaQualidadePreviewCard({
  agendamentoId,
  qualidadeAtual,
  arquivada,
  podeEditar,
}: GaleriaQualidadePreviewCardProps) {
  const [qualidade, setQualidade] = useState<QualidadePreview>(qualidadeAtual)
  const aplicar = useAplicarQualidadeGaleria(agendamentoId)

  useEffect(() => {
    setQualidade(qualidadeAtual)
  }, [qualidadeAtual])

  const alterou = qualidade !== qualidadeAtual

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-violet-100 p-2 text-violet-700">
            <Image className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Qualidade da prévia</h2>
            <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">
              Controla a resolução exibida na galeria do cliente. O download continua
              no arquivo original, sem marca d&apos;água.
            </p>
          </div>
        </div>
        {!podeEditar && (
          <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <Lock className="h-3 w-3" />
            Somente ADMIN altera
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          {podeEditar ? (
            <Select
              value={qualidade}
              onValueChange={(valor) => setQualidade(valor as QualidadePreview)}
              disabled={aplicar.isPending || arquivada}
            >
              <SelectTrigger className="h-9 w-full bg-background text-xs" aria-label="Qualidade da prévia">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROTEGIDA">Protegida (800px)</SelectItem>
                <SelectItem value="EQUILIBRADA">Equilibrada (1600px)</SelectItem>
                <SelectItem value="ORIGINAL">Original</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm font-medium">{LABEL[qualidadeAtual]}</p>
          )}
          <p className="mt-1.5 text-[11px] text-muted-foreground">{DESCRICAO[qualidade]}</p>
          {arquivada && (
            <p className="mt-1 text-[11px] text-amber-700">
              Galeria arquivada: não é possível aplicar qualidade.
            </p>
          )}
          {podeEditar && alterou && !arquivada && (
            <p className="mt-1 text-[11px] text-amber-700">
              Aplicar vai regenerar as prévias desta galeria e pode levar alguns minutos.
            </p>
          )}
        </div>
        {podeEditar && (
          <Button
            size="sm"
            onClick={() => aplicar.mutate(qualidade)}
            disabled={!alterou || aplicar.isPending || arquivada}
            title={!alterou ? 'Selecione uma qualidade diferente da atual' : 'Regenerar as prévias desta galeria'}
          >
            {aplicar.isPending ? 'Aplicando...' : 'Aplicar qualidade'}
          </Button>
        )}
      </div>
    </section>
  )
}
