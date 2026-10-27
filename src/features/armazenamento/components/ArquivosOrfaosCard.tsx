import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, Loader2, RefreshCw, Search, Trash2 } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { extractErrorMessage } from '@/shared/api'
import { formatarBytes } from '@/shared/lib/bytes'
import { useArquivosOrfaos, useLimparOrfaos } from '../api/queries'

function formatarData(valor: string | null): string {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return '—'
  return format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function ArquivosOrfaosCard() {
  const [analisado, setAnalisado] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const orfaos = useArquivosOrfaos(analisado)
  const limpar = useLimparOrfaos()

  const dados = orfaos.data

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Arquivos órfãos</p>
            <p className="text-xs text-muted-foreground">
              Arquivos no disco sem referência no banco. Só nomes conhecidos e com mais de 24h são
              elegíveis; arquivos desconhecidos ou recentes são preservados.
            </p>
          </div>
          {analisado && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void orfaos.refetch()}
              disabled={orfaos.isFetching}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Atualizar
            </Button>
          )}
        </div>

        {!analisado ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setAnalisado(true)}
          >
            <Search className="mr-1 h-4 w-4" />
            Analisar órfãos
          </Button>
        ) : orfaos.isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Varrendo o diretório de uploads...
          </div>
        ) : orfaos.isError || !dados ? (
          <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
            <div>
              <p>Não foi possível analisar os arquivos órfãos.</p>
              <p className="text-xs">{extractErrorMessage(orfaos.error, 'Tente novamente.')}</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span>
                <strong>{dados.total}</strong> arquivo(s) · {formatarBytes(dados.bytes)}
              </span>
              <span className="text-emerald-700">
                <strong>{dados.elegiveis}</strong> elegível(is) · {formatarBytes(dados.bytesElegiveis)}
              </span>
              {dados.desconhecidos > 0 && (
                <span className="text-muted-foreground">
                  {dados.desconhecidos} desconhecido(s) (preservados)
                </span>
              )}
            </div>

            {dados.total === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum arquivo órfão encontrado no diretório de uploads.
              </p>
            ) : (
              <>
                <ul className="divide-y rounded-lg border">
                  {dados.arquivos.slice(0, 20).map((arquivo) => (
                    <li
                      key={arquivo.caminho}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
                    >
                      <span className="min-w-0 flex-1 truncate font-mono" title={arquivo.caminho}>
                        {arquivo.caminho}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatarBytes(arquivo.bytes)} · {formatarData(arquivo.modificadoEm)}
                      </span>
                      {arquivo.elegivel ? (
                        <Badge variant="warning">Elegível</Badge>
                      ) : arquivo.reconhecido ? (
                        <Badge variant="outline">Recente</Badge>
                      ) : (
                        <Badge variant="secondary">Desconhecido</Badge>
                      )}
                    </li>
                  ))}
                </ul>
                {dados.truncado && (
                  <p className="text-xs text-muted-foreground">
                    Exibindo os 200 maiores. A limpeza considera todos os elegíveis.
                  </p>
                )}
              </>
            )}

            <Button
              variant="destructive"
              size="sm"
              disabled={dados.elegiveis === 0 || limpar.isPending}
              onClick={() => setConfirmar(true)}
            >
              {limpar.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1 h-4 w-4" />
              )}
              Limpar órfãos elegíveis
            </Button>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmar}
        onOpenChange={setConfirmar}
        title="Limpar arquivos órfãos?"
        description={
          dados
            ? `Serão apagados ${dados.elegiveis} arquivo(s) (${formatarBytes(dados.bytesElegiveis)}). Arquivos referenciados, recentes ou com nome desconhecido não são tocados.`
            : 'Somente arquivos órfãos elegíveis serão apagados.'
        }
        confirmText="Limpar"
        variant="destructive"
        isLoading={limpar.isPending}
        onConfirm={() =>
          limpar.mutate(undefined, {
            onSuccess: () => {
              setConfirmar(false)
              void orfaos.refetch()
            },
          })
        }
      />
    </Card>
  )
}
