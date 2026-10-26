import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Upload, Trash2, Send, ImagePlus, Image as ImageIcon, X, Loader2, Star, Pencil, Eye, EyeOff, RefreshCw, MessageCircle, Check, Lock, Search, MoreVertical, Package, Heart, AlertTriangle, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { extractErrorMessage } from '@/shared/api'
import { Button } from '@/shared/components/ui/button'
import { PageLoading } from '@/shared/components/layout/Loading'
import { AuthImage } from '@/shared/components/ui/AuthImage'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { cn } from '@/shared/lib/cn'
import { AGENDAMENTO_STATUS, type AgendamentoStatus } from '@/shared/constants'
import { fotoThumbUrl, numeroGaleriaLabel, rotuloFoto } from '@/shared/lib/foto'
import { useAgendamento, useFotosList, useUploadFotos, usePublicarFotos, useRenumerarGaleria, useGaleriaEnsaio, useDefinirCapaGaleria, useDeletarFoto, useDeletarFotosEmLote, useUpdateFotoMetadata, useAlterarVisibilidade, useAlterarStatus, useSubstituirImagem, useComentariosAdmin, useOverrideSelecao } from '../api/queries'
import { useAuth } from '@/features/auth/AuthProvider'
import { ComentariosDialog } from '../components/ComentariosDialog'
import { UploadLoteError, type UploadProgress } from '../services/foto.service'
import type { FotoEnsaio } from '@/features/ecommerce/types/ecommerce.types'

/** Limite por imagem aceito pelo backend (FileValidator, contexto "image"). */
const LIMITE_ARQUIVO_BYTES = 100 * 1024 * 1024

const CATEGORIAS = [
  'Casamento',
  'Pré-wedding',
  'Ensaio Gestante',
  'Newborn',
  'Infantil',
  'Familiar',
  'Formatura',
  'Evento',
  'Retrato',
  'Outros',
]

/**
 * Fotos já entregues (pacote) ou vinculadas a uma compra pendente/paga não
 * podem ser removidas para não quebrar download e carrinho do cliente.
 */
function fotoProtegida(foto: FotoEnsaio): boolean {
  return (
    foto.compraExtraId !== null ||
    foto.selecionadaPacote ||
    foto.emSelecaoEdicao === true ||
    foto.temVersaoEditada === true ||
    foto.versaoAtual === 'EDITADA' ||
    foto.downloadada === true ||
    foto.status === 'PAGA' ||
    foto.status === 'AGUARDANDO_COMPROVANTE' ||
    foto.status === 'AGUARDANDO_CONFIRMACAO'
  )
}

function statusFotoLabel(status: FotoEnsaio['status']): string {
  switch (status) {
    case 'PUBLICADA': return 'Publicada'
    case 'INEDITA': return 'Inédita'
    case 'PAGA': return 'Paga'
    case 'AGUARDANDO_COMPROVANTE': return 'Aguard. comprovante'
    case 'AGUARDANDO_CONFIRMACAO': return 'Aguard. confirmação'
    default: return status
  }
}

function statusFotoBadgeClass(status: FotoEnsaio['status']): string {
  switch (status) {
    case 'PUBLICADA': return 'bg-emerald-100 text-emerald-700'
    case 'INEDITA': return 'bg-amber-100 text-amber-700'
    case 'PAGA': return 'bg-violet-100 text-violet-700'
    case 'AGUARDANDO_COMPROVANTE':
    case 'AGUARDANDO_CONFIRMACAO': return 'bg-amber-100 text-amber-700'
    default: return 'bg-blue-100 text-blue-700'
  }
}

type FiltroFoto = 'todas' | 'pacote' | 'extras' | 'sem-selecao' | 'em-edicao' | 'publicadas' | 'ineditas' | 'ocultas'
type TipoSelecaoFoto = 'PACOTE' | 'EXTRA'

function tipoSelecaoDaFoto(
  foto: FotoEnsaio,
  mapa?: Map<string, TipoSelecaoFoto>,
): TipoSelecaoFoto | null {
  return mapa?.get(foto.id) ?? (foto.selecionadaPacote ? 'PACOTE' : null)
}

function AcaoFotoSheet({
  icone: Icone,
  rotulo,
  descricao,
  onClick,
  disabled = false,
  destrutivo = false,
}: {
  icone: LucideIcon
  rotulo: string
  descricao?: string
  onClick: () => void
  disabled?: boolean
  destrutivo?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        destrutivo
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-muted',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
      )}
    >
      <Icone className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{rotulo}</span>
        {descricao && <span className="mt-0.5 block text-xs text-muted-foreground">{descricao}</span>}
      </span>
    </button>
  )
}

function FotoMetadataDialog({ agendamentoId, foto, open, onOpenChange }: {
  agendamentoId: string
  foto: FotoEnsaio
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [titulo, setTitulo] = useState(foto.titulo ?? '')
  const [tags, setTags] = useState((foto.tags ?? []).join(', '))
  const [categoria, setCategoria] = useState(foto.categoria ?? '')
  const [destaque, setDestaque] = useState(foto.destaque)

  const { mutate: update, isPending } = useUpdateFotoMetadata(agendamentoId)

  function handleSave() {
    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    update(
      {
        fotoId: foto.id,
        metadata: {
          titulo: titulo || undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          categoria: categoria || undefined,
          destaque,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Metadados</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
              <AuthImage src={fotoThumbUrl(foto)} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{foto.fileName}</p>
              <p className="text-xs text-muted-foreground">{foto.status}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="foto-titulo">Título</Label>
            <Input id="foto-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nome da foto" />
          </div>

          <div>
            <Label htmlFor="foto-tags">Tags (separadas por vírgula)</Label>
            <Input id="foto-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ex: praia, casal, pôr do sol" />
          </div>

          <div>
            <Label htmlFor="foto-categoria">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger id="foto-categoria">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="foto-destaque" checked={destaque} onCheckedChange={(v) => setDestaque(v === true)} />
            <Label htmlFor="foto-destaque" className="cursor-pointer">Foto em destaque</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AdminGaleriaPage({
  tipoPorFoto,
  favoritosPorFoto,
  pacoteLimite = 0,
}: {
  tipoPorFoto?: Map<string, TipoSelecaoFoto>
  favoritosPorFoto?: Record<string, number>
  pacoteLimite?: number
}) {
  const { id } = useParams<{ id: string }>()
  const inputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [editFoto, setEditFoto] = useState<FotoEnsaio | null>(null)
  const [replaceFotoId, setReplaceFotoId] = useState<string | null>(null)
  const [confirmDeleteFotoId, setConfirmDeleteFotoId] = useState<string | null>(null)
  const [comentariosFoto, setComentariosFoto] = useState<FotoEnsaio | null>(null)
  const [modoSelecao, setModoSelecao] = useState(false)
  const [modoSelecaoCapa, setModoSelecaoCapa] = useState(false)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [confirmDeleteLote, setConfirmDeleteLote] = useState(false)
  const [confirmRenumerar, setConfirmRenumerar] = useState(false)
  const [filtroFoto, setFiltroFoto] = useState<FiltroFoto>('todas')
  const [buscaFoto, setBuscaFoto] = useState('')
  const [categoriaFoto, setCategoriaFoto] = useState('')
  const [fotoAcoes, setFotoAcoes] = useState<FotoEnsaio | null>(null)
  const [uploadAberto, setUploadAberto] = useState(false)

  const { data: fotos = [], isLoading, isError, error, refetch: refetchFotos } = useFotosList(id)
  const { data: comentariosAdmin = [] } = useComentariosAdmin(id)
  const { mutate: uploadFotos, isPending: isUploading } = useUploadFotos(id ?? '')
  const { mutate: publicar, isPending: isPublishing } = usePublicarFotos(id ?? '')
  const { mutate: renumerar, isPending: isRenumerando } = useRenumerarGaleria(id ?? '')
  const { mutate: deletar } = useDeletarFoto(id ?? '')
  const { mutate: deletarEmLote, isPending: isDeletingLote } = useDeletarFotosEmLote(id ?? '')
  const { mutate: alterarVisibilidade } = useAlterarVisibilidade(id ?? '')
  const { mutate: alterarStatus } = useAlterarStatus(id ?? '')
  const { mutate: substituirImagem, isPending: isReplacing } = useSubstituirImagem(id ?? '')
  const { data: agendamento } = useAgendamento(id)
  const { papel } = useAuth()
  const { data: galeriaEnsaio } = useGaleriaEnsaio(id)
  const { mutate: definirCapa, isPending: isDefinindoCapa } = useDefinirCapaGaleria(id ?? '')
  const { mutate: overrideSelecao, isPending: isOverridingSelecao } = useOverrideSelecao(id ?? '')

  const comentariosPorFoto = useMemo(
    () => new Map(comentariosAdmin.map((item) => [item.foto.id, item])),
    [comentariosAdmin]
  )

  const categorias = useMemo(
    () => Array.from(new Set(fotos.map((foto) => foto.categoria).filter(Boolean))).sort() as string[],
    [fotos],
  )

  const fotosFiltradas = useMemo(() => {
    return fotos.filter((foto) => {
      const tipo = tipoSelecaoDaFoto(foto, tipoPorFoto)
      if (filtroFoto === 'pacote' && tipo !== 'PACOTE') return false
      if (filtroFoto === 'extras' && tipo !== 'EXTRA') return false
      if (filtroFoto === 'sem-selecao' && tipo) return false
      if (filtroFoto === 'em-edicao' && !foto.emSelecaoEdicao) return false
      if (filtroFoto === 'publicadas' && foto.status !== 'PUBLICADA') return false
      if (filtroFoto === 'ineditas' && foto.status !== 'INEDITA') return false
      if (filtroFoto === 'ocultas' && foto.visivel) return false

      if (categoriaFoto && foto.categoria !== categoriaFoto) return false

      const termo = buscaFoto.trim().toLowerCase()
      if (termo) {
        const numero = foto.numeroGaleria != null
          ? `${foto.numeroGaleria} ${numeroGaleriaLabel(foto.numeroGaleria)}`
          : ''
        const alvo = [foto.fileName, foto.titulo ?? '', ...(foto.tags ?? []), numero].join(' ').toLowerCase()
        if (!alvo.includes(termo)) return false
      }

      return true
    })
  }, [fotos, tipoPorFoto, filtroFoto, categoriaFoto, buscaFoto])

  // Previews em state + effect: o progresso do upload re-renderiza a tela
  // várias vezes e recriar os object URLs a cada render vazaria memória.
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])

  useEffect(() => {
    const novas = selectedFiles.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPreviews(novas)
    return () => novas.forEach((preview) => URL.revokeObjectURL(preview.url))
  }, [selectedFiles])

  const STATUS_LIBERADOS = [
    AGENDAMENTO_STATUS.EM_EDICAO,
    AGENDAMENTO_STATUS.FINALIZADO,
  ] as AgendamentoStatus[]

  const uploadLiberado = agendamento ? STATUS_LIBERADOS.includes(agendamento.status) : false
  const publicacaoLiberada = uploadLiberado

  if (!id) return <PageLoading />

  const ineditas = fotos.filter((f) => f.status === 'INEDITA').length
  const publicadas = fotos.filter((f) => f.status === 'PUBLICADA').length
  const ocultas = fotos.filter((f) => !f.visivel).length
  const destaques = fotos.filter((f) => f.destaque).length
  const renumeracaoBloqueada = fotos.some((foto) =>
    foto.selecionadaPacote
    || foto.downloadada
    || foto.temVersaoEditada === true
    || foto.compraExtraId !== null
    || foto.emSelecaoEdicao === true
    || foto.status === 'PAGA'
    || foto.status === 'AGUARDANDO_COMPROVANTE'
    || foto.status === 'AGUARDANDO_CONFIRMACAO')

  const capaFoto = galeriaEnsaio?.capaFotoId
    ? fotos.find((f) => f.id === galeriaEnsaio.capaFotoId) ?? null
    : null
  const podeSerCapa = (foto: FotoEnsaio) =>
    foto.visivel && (foto.status === 'PUBLICADA' || foto.status === 'PAGA')
  const selecionarCapa = (fotoId: string) => {
    definirCapa(fotoId, { onSuccess: () => setModoSelecaoCapa(false) })
  }

  const fotosSelecionaveis = fotosFiltradas.filter((f) => !fotoProtegida(f))
  const totalProtegidas = fotosFiltradas.length - fotosSelecionaveis.length
  const todasSelecionadas =
    fotosSelecionaveis.length > 0 && fotosSelecionaveis.every((f) => selecionadas.has(f.id))

  const filtros: { id: FiltroFoto; label: string; count: number }[] = [
    { id: 'todas', label: 'Todas', count: fotos.length },
    { id: 'pacote', label: 'Pacote', count: fotos.filter((foto) => tipoSelecaoDaFoto(foto, tipoPorFoto) === 'PACOTE').length },
    { id: 'extras', label: 'Extras', count: fotos.filter((foto) => tipoSelecaoDaFoto(foto, tipoPorFoto) === 'EXTRA').length },
    { id: 'sem-selecao', label: 'Sem seleção', count: fotos.filter((foto) => !tipoSelecaoDaFoto(foto, tipoPorFoto)).length },
    { id: 'em-edicao', label: 'Em edição', count: fotos.filter((foto) => foto.emSelecaoEdicao).length },
    { id: 'publicadas', label: 'Publicadas', count: publicadas },
    { id: 'ineditas', label: 'Inéditas', count: ineditas },
    { id: 'ocultas', label: 'Ocultas', count: ocultas },
  ]
  const filtroAtivo = filtroFoto !== 'todas' || buscaFoto.trim() !== '' || categoriaFoto !== ''
  const limparFiltros = () => {
    setFiltroFoto('todas')
    setBuscaFoto('')
    setCategoriaFoto('')
  }
  const tipoAcoes = fotoAcoes ? tipoSelecaoDaFoto(fotoAcoes, tipoPorFoto) : null
  const naoLidasAcoes = fotoAcoes ? (comentariosPorFoto.get(fotoAcoes.id)?.naoLidas ?? 0) : 0
  const exibirDropzone = uploadAberto || fotos.length === 0 || selectedFiles.length > 0 || isUploading
  const selecaoEditavel = !galeriaEnsaio
    || galeriaEnsaio.modo === 'DIRETO'
    || galeriaEnsaio.fase === 'SELECAO'
  const totalSelecionadoPacote = fotos.filter((foto) => foto.selecionadaPacote).length
  const pacoteCheio = pacoteLimite > 0 && totalSelecionadoPacote >= pacoteLimite
  const overrideBloqueadoNaAcoes = fotoAcoes
    ? (fotoAcoes.selecionadaPacote
      ? fotoAcoes.downloadada || fotoAcoes.temVersaoEditada === true
      : pacoteCheio)
    : false

  const cancelarSelecao = () => {
    setModoSelecao(false)
    setSelecionadas(new Set())
  }

  const toggleSelecao = (foto: FotoEnsaio) => {
    if (fotoProtegida(foto)) return
    setSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(foto.id)) {
        next.delete(foto.id)
      } else {
        next.add(foto.id)
      }
      return next
    })
  }

  const toggleTodas = () => {
    setSelecionadas(
      todasSelecionadas ? new Set() : new Set(fotosSelecionaveis.map((f) => f.id)),
    )
  }

  const handleUpload = () => {
    if (selectedFiles.length === 0 || isUploading) return

    const acimaDoLimite = selectedFiles.filter((file) => file.size > LIMITE_ARQUIVO_BYTES)
    if (acimaDoLimite.length > 0) {
      toast.error(
        `Arquivo(s) acima de ${LIMITE_ARQUIVO_BYTES / (1024 * 1024)} MB: ${acimaDoLimite.map((f) => f.name).join(', ')}`
      )
      return
    }

    setUploadProgress(null)
    uploadFotos(
      { arquivos: selectedFiles, onProgress: setUploadProgress },
      {
        onSuccess: () => {
          setSelectedFiles([])
          setUploadProgress(null)
        },
        onError: (error) => {
          setUploadProgress(null)
          // Mantém selecionados apenas os arquivos que ainda não foram enviados.
          if (error instanceof UploadLoteError) {
            setSelectedFiles(error.restantes)
          }
        },
      }
    )
  }

  const allPublished = fotos.length > 0 && fotos.every((f) =>
    f.status === 'PUBLICADA'
    || f.status === 'PAGA'
    || f.status === 'AGUARDANDO_COMPROVANTE'
    || f.status === 'AGUARDANDO_CONFIRMACAO'
  )

  const percentualUpload = uploadProgress && uploadProgress.totalArquivos > 0
    ? Math.min(100, Math.round(
        ((uploadProgress.arquivosConcluidos + uploadProgress.percentualLote * uploadProgress.arquivosNoLote) /
          uploadProgress.totalArquivos) * 100
      ))
    : 0

  const handleReplaceImage = (fotoId: string) => {
    setReplaceFotoId(fotoId)
    replaceInputRef.current?.click()
  }

  const handleReplaceFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !replaceFotoId) return
    substituirImagem(
      { fotoId: replaceFotoId, arquivo: file },
      { onSettled: () => { setReplaceFotoId(null); if (replaceInputRef.current) replaceInputRef.current.value = '' } }
    )
  }

  return (
    <div>
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        className="hidden"
        onChange={handleReplaceFileSelected}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
          {fotos.length > 0 && (
            modoSelecao ? (
              <Button variant="outline" size="sm" onClick={cancelarSelecao}>
                <X className="mr-1 h-4 w-4" />
                Cancelar seleção
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => { setModoSelecaoCapa(false); setModoSelecao(true) }}>
                <Check className="mr-1 h-4 w-4" />
                Selecionar fotos
              </Button>
            )
          )}
          {papel !== 'AGENDADOR' && (
            <Button
              variant={modoSelecaoCapa ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setModoSelecao(false); setModoSelecaoCapa((prev) => !prev) }}
              disabled={isDefinindoCapa}
            >
              <ImageIcon className="mr-1 h-4 w-4" />
              {modoSelecaoCapa ? 'Cancelar capa' : 'Escolher capa'}
            </Button>
          )}
          {capaFoto && papel !== 'AGENDADOR' && (
            <Button variant="ghost" size="sm" onClick={() => definirCapa(null)} disabled={isDefinindoCapa}>
              Remover capa
            </Button>
          )}
          {publicadas > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRenumerar(true)}
              disabled={renumeracaoBloqueada}
              title={renumeracaoBloqueada
                ? 'A numeração já foi usada em seleção, download, compra ou edição'
                : undefined}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Renumerar
            </Button>
          )}
          {publicacaoLiberada && fotos.length > 0 && !allPublished && (
            <Button onClick={() => publicar()} disabled={isPublishing} variant="default" size="sm">
              {isPublishing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Publicar Galeria
            </Button>
          )}
      </div>

      {modoSelecaoCapa && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <ImageIcon className="h-4 w-4 text-primary" />
          <span>
            Clique na foto que deve aparecer no topo da galeria do cliente.
            {galeriaEnsaio?.fase === 'COMERCIALIZACAO' && galeriaEnsaio?.modo === 'COM_EDICAO'
              ? ' Em comercialização, apenas fotos da seleção publicada podem ser capa.'
              : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => setModoSelecaoCapa(false)}
          >
            Cancelar
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {uploadLiberado ? (
          <div className="rounded-xl border bg-card p-3 sm:p-4">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  const novos = Array.from(e.target.files)
                  setSelectedFiles((prev) => [...prev, ...novos])
                  e.target.value = ''
                }
              }}
            />
            {exibirDropzone ? (
              <>
                <div
                  onClick={() => { if (!isUploading) inputRef.current?.click() }}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 transition-colors sm:p-8 ${
                    isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
              <ImagePlus className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">Toque para tirar fotos ou selecionar da galeria</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG — múltiplos arquivos</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {previews.map(({ file, url }, i) => (
                    <div key={`${file.name}-${file.size}-${i}`} className="relative group">
                      <img
                        src={url}
                        alt={file.name}
                        className="h-16 w-16 rounded-md object-cover border"
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => setSelectedFiles((prev) => prev.filter((_, j) => j !== i))}
                        aria-label={`Remover ${file.name}`}
                        className="absolute -top-1.5 -right-1.5 h-9 w-9 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:pointer-events-none disabled:opacity-40"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {isUploading ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {uploadProgress
                          ? `Enviando lote ${uploadProgress.loteAtual}/${uploadProgress.totalLotes} — ${uploadProgress.arquivosConcluidos} de ${uploadProgress.totalArquivos} foto(s) concluída(s)`
                          : 'Preparando envio…'}
                      </span>
                      <span className="font-medium tabular-nums">{percentualUpload}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${percentualUpload}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{selectedFiles.length} arquivo(s) selecionado(s)</p>
                    <Button size="sm" onClick={handleUpload}>
                      <Upload className="mr-1 h-4 w-4" />
                      Enviar
                    </Button>
                  </div>
                )}
              </div>
            )}
                {fotos.length > 0 && !isUploading && selectedFiles.length === 0 && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setUploadAberto(false)}>
                    Recolher
                  </Button>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadAberto(true)
                    inputRef.current?.click()
                  }}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  Enviar fotos
                </Button>
                <span className="text-xs text-muted-foreground">JPG, PNG — múltiplos arquivos</span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium mb-1">Upload indisponível</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Ensaio ainda não finalizado. O upload de fotos será liberado após o registro do pagamento dos 70% restantes.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>Total: <strong>{fotos.length}</strong></span>
          <span className="inline-block h-3 w-px bg-border" />
          <span>Inéditas: <strong className="text-amber-600">{ineditas}</strong></span>
          <span className="inline-block h-3 w-px bg-border" />
          <span>Publicadas: <strong className="text-emerald-600">{publicadas}</strong></span>
          <span className="inline-block h-3 w-px bg-border" />
          <span>Ocultas: <strong className="text-muted-foreground">{ocultas}</strong></span>
          <span className="inline-block h-3 w-px bg-border" />
          <span>Destaque: <strong className="text-amber-500">{destaques}</strong></span>
        </div>

        <div className="rounded-xl border bg-card p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={buscaFoto}
                onChange={(event) => setBuscaFoto(event.target.value)}
                placeholder="Buscar por número, nome, título ou tag..."
                className="pl-9 pr-9"
                aria-label="Buscar fotos"
              />
              {buscaFoto && (
                <button
                  type="button"
                  onClick={() => setBuscaFoto('')}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {categorias.length > 0 && (
              <select
                value={categoriaFoto}
                onChange={(event) => setCategoriaFoto(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-auto"
                aria-label="Filtrar por categoria"
              >
                <option value="">Todas as categorias</option>
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            )}
            {filtroAtivo && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {filtros.map((filtro) => (
              <button
                key={filtro.id}
                type="button"
                onClick={() => setFiltroFoto(filtro.id)}
                aria-pressed={filtroFoto === filtro.id}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  filtroFoto === filtro.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {filtro.label}
                <span className={cn(
                  'ml-1 tabular-nums',
                  filtroFoto === filtro.id ? 'text-primary-foreground/70' : 'text-muted-foreground/70',
                )}>
                  {filtro.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {modoSelecao && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTodas}
              disabled={fotosSelecionaveis.length === 0 || isDeletingLote}
            >
              {todasSelecionadas ? 'Desmarcar todas' : `Selecionar todas (${fotosSelecionaveis.length})`}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selecionadas.size} selecionada(s)
              {totalProtegidas > 0 ? ` · ${totalProtegidas} protegida(s)` : ''}
            </span>
            <div className="ml-auto">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDeleteLote(true)}
                disabled={selecionadas.size === 0 || isDeletingLote}
              >
                {isDeletingLote ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-1 h-4 w-4" />
                )}
                Remover selecionadas ({selecionadas.size})
              </Button>
            </div>
          </div>
        )}

        {isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-4 py-16 text-center">
            <AlertTriangle className="mb-2 h-8 w-8 text-amber-600" />
            <p className="text-sm font-medium">Não foi possível carregar as fotos</p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              {extractErrorMessage(error, 'Tente novamente em instantes.')}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void refetchFotos()}>
              Tentar novamente
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/2] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : fotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ImagePlus className="mb-2 h-8 w-8" />
            <p className="text-sm">Nenhuma foto enviada ainda</p>
            <p className="text-xs mt-1">Use o campo acima para fazer upload</p>
          </div>
        ) : fotosFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center text-muted-foreground">
            <Search className="mb-2 h-8 w-8" />
            <p className="text-sm font-medium">Nenhuma foto encontrada</p>
            <p className="mt-1 text-xs">Tente outro filtro ou limpe a busca.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {fotosFiltradas.map((foto) => {
              const tipo = tipoSelecaoDaFoto(foto, tipoPorFoto)
              const naoLidas = comentariosPorFoto.get(foto.id)?.naoLidas ?? 0
              const favoritos = favoritosPorFoto?.[foto.id] ?? 0
              return (
              <div key={foto.id} className={`group relative rounded-lg border bg-card overflow-hidden ${!foto.visivel ? 'opacity-50' : ''} ${modoSelecao && selecionadas.has(foto.id) ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} ${modoSelecao && fotoProtegida(foto) ? 'opacity-60' : ''} ${galeriaEnsaio?.capaFotoId === foto.id ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-background' : ''}`}>
                <div className="aspect-[3/2] relative">
                  {foto.numeroGaleria != null && (
                    <span className="absolute left-1 top-1 z-10 rounded bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white shadow-sm backdrop-blur">
                      {numeroGaleriaLabel(foto.numeroGaleria)}
                    </span>
                  )}
                  {foto.destaque && (
                    <div className={`absolute top-1 z-10 ${foto.numeroGaleria != null ? 'left-12' : 'left-1'}`}>
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    </div>
                  )}
                  {!foto.visivel && (
                    <div className="absolute top-1 right-1 z-10 rounded bg-muted-foreground/80 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      Oculta
                    </div>
                  )}
                  {foto.fotoEdicaoId && (
                    <div className="absolute bottom-1 left-1 z-10 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
                      Aprovada
                    </div>
                  )}
                  {tipo && (
                    <span
                      className={`absolute left-1 top-7 z-10 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur ${
                        tipo === 'PACOTE' ? 'bg-sky-600/90' : 'bg-orange-500/90'
                      }`}
                    >
                      {tipo === 'PACOTE' ? 'Pacote' : 'Extra'}
                    </span>
                  )}
                  <AuthImage
                    src={fotoThumbUrl(foto)}
                    alt={rotuloFoto(foto)}
                    className="h-full w-full object-cover"
                  />
                  {modoSelecaoCapa && (
                    <button
                      type="button"
                      onClick={() => selecionarCapa(foto.id)}
                      disabled={isDefinindoCapa || !podeSerCapa(foto)}
                      title={podeSerCapa(foto) ? undefined : 'A foto precisa estar visível e publicada'}
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-1 bg-slate-950/45 text-white transition-colors hover:bg-slate-950/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ImageIcon className="h-6 w-6" />
                      <span className="px-2 text-center text-xs font-semibold">
                        {podeSerCapa(foto) ? 'Usar como capa' : 'Indisponível para capa'}
                      </span>
                    </button>
                  )}
                  {modoSelecao && (
                    <button
                      type="button"
                      onClick={() => toggleSelecao(foto)}
                      disabled={fotoProtegida(foto)}
                      aria-pressed={selecionadas.has(foto.id)}
                      aria-label={
                        fotoProtegida(foto)
                          ? `Foto protegida: ${foto.fileName}`
                          : `${selecionadas.has(foto.id) ? 'Desmarcar' : 'Selecionar'} ${foto.fileName}`
                      }
                      title={fotoProtegida(foto) ? 'Vinculada a compra/pacote — não pode ser removida' : undefined}
                      className="absolute inset-0 z-20 flex items-start justify-start p-2 disabled:cursor-not-allowed"
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md border-2 shadow-sm ${
                          fotoProtegida(foto)
                            ? 'border-muted-foreground/60 bg-background/90 text-muted-foreground'
                            : selecionadas.has(foto.id)
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-white bg-black/30 text-transparent'
                        }`}
                      >
                        {fotoProtegida(foto) ? <Lock className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  )}
                  {!modoSelecao && !modoSelecaoCapa && (
                    <>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/45 to-transparent" />
                      <button
                        type="button"
                        onClick={() => setFotoAcoes(foto)}
                        aria-label={`Ações de ${foto.fileName}`}
                        className="absolute bottom-1 right-1 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/65 text-white shadow-sm backdrop-blur transition-colors hover:bg-slate-950/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:h-10 sm:w-10"
                      >
                        <MoreVertical className="h-4 w-4" />
                        {naoLidas > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                            {naoLidas}
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-xs text-muted-foreground" title={foto.fileName}>
                    {foto.numeroGaleria != null && (
                      <span className="mr-1 font-semibold tabular-nums text-primary">
                        {numeroGaleriaLabel(foto.numeroGaleria)}
                      </span>
                    )}
                    {foto.fileName}
                  </p>
                  {foto.titulo && (
                    <p className="truncate text-[10px] text-muted-foreground/70">{foto.titulo}</p>
                  )}
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {galeriaEnsaio?.capaFotoId === foto.id && (
                      <span className="inline-flex items-center gap-0.5 rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        <ImageIcon className="h-3 w-3" /> Capa
                      </span>
                    )}
                    {tipo && (
                      <span className={`inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${
                        tipo === 'PACOTE' ? 'bg-sky-100 text-sky-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {tipo === 'PACOTE' ? 'Pacote' : 'Extra'}
                      </span>
                    )}
                    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${statusFotoBadgeClass(foto.status)}`}>
                      {statusFotoLabel(foto.status)}
                    </span>
                    {!foto.visivel && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                        <EyeOff className="h-3 w-3" /> Oculta
                      </span>
                    )}
                    {fotoProtegida(foto) && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                        <Lock className="h-3 w-3" /> Protegida
                      </span>
                    )}
                    {favoritos > 0 && (
                      <span
                        role="img"
                        aria-label={`${favoritos} curtida(s)`}
                        className="inline-flex items-center gap-0.5 rounded-sm bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600"
                      >
                        <Heart className="h-3 w-3" fill="currentColor" /> {favoritos}
                      </span>
                    )}
                    {foto.categoria && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">{foto.categoria}</span>
                    )}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>

      <Sheet open={fotoAcoes !== null} onOpenChange={(open) => { if (!open) setFotoAcoes(null) }}>
        <SheetContent className="gap-3">
          <SheetTitle className="pr-8 text-base">Ações da foto</SheetTitle>
          {fotoAcoes && (
            <>
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2">
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  <AuthImage
                    src={fotoThumbUrl(fotoAcoes)}
                    alt={rotuloFoto(fotoAcoes)}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {fotoAcoes.numeroGaleria != null && (
                      <span className="mr-1 tabular-nums text-primary">
                        {numeroGaleriaLabel(fotoAcoes.numeroGaleria)}
                      </span>
                    )}
                    {fotoAcoes.fileName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {tipoAcoes && (
                      <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${
                        tipoAcoes === 'PACOTE' ? 'bg-sky-100 text-sky-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {tipoAcoes === 'PACOTE' ? 'Pacote' : 'Extra'}
                      </span>
                    )}
                    <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${statusFotoBadgeClass(fotoAcoes.status)}`}>
                      {statusFotoLabel(fotoAcoes.status)}
                    </span>
                    {!fotoAcoes.visivel && (
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Oculta
                      </span>
                    )}
                    {fotoProtegida(fotoAcoes) && (
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Protegida
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <AcaoFotoSheet
                  icone={Pencil}
                  rotulo="Editar metadados"
                  descricao="Título, tags, categoria e destaque"
                  onClick={() => { setEditFoto(fotoAcoes); setFotoAcoes(null) }}
                />
                {(papel === 'ADMIN' || papel === 'FOTOGRAFO')
                  && selecaoEditavel
                  && fotoAcoes.status === 'PUBLICADA'
                  && fotoAcoes.visivel
                  && !fotoAcoes.compraExtraId && (
                  <AcaoFotoSheet
                    icone={Package}
                    rotulo={fotoAcoes.selecionadaPacote ? 'Remover do pacote' : 'Incluir no pacote'}
                    descricao={
                      fotoAcoes.selecionadaPacote
                        ? (fotoAcoes.downloadada || fotoAcoes.temVersaoEditada
                          ? 'Foto já baixada/editada — não pode sair do pacote.'
                          : 'Ajuste manual da seleção do cliente')
                        : (pacoteCheio
                          ? `Pacote cheio (${totalSelecionadoPacote}/${pacoteLimite}). Remova outra foto antes.`
                          : 'Ajuste manual da seleção do cliente')
                    }
                    disabled={isOverridingSelecao || overrideBloqueadoNaAcoes}
                    onClick={() => overrideSelecao(
                      { fotoId: fotoAcoes.id, selecionada: !fotoAcoes.selecionadaPacote },
                      { onSuccess: () => setFotoAcoes(null) },
                    )}
                  />
                )}
                {(fotoAcoes.status === 'PUBLICADA' || fotoAcoes.status === 'INEDITA') && (
                  <AcaoFotoSheet
                    icone={fotoProtegida(fotoAcoes) ? Lock : fotoAcoes.status === 'PUBLICADA' ? X : Send}
                    rotulo={fotoProtegida(fotoAcoes)
                      ? 'Status bloqueado'
                      : fotoAcoes.status === 'PUBLICADA' ? 'Despublicar' : 'Publicar individualmente'}
                    descricao={fotoProtegida(fotoAcoes)
                      ? 'Foto no pacote, baixada, editada ou em compra.'
                      : undefined}
                    disabled={fotoProtegida(fotoAcoes)}
                    onClick={() => {
                      if (fotoProtegida(fotoAcoes)) return
                      alterarStatus({
                        fotoId: fotoAcoes.id,
                        status: fotoAcoes.status === 'PUBLICADA' ? 'INEDITA' : 'PUBLICADA',
                      })
                      setFotoAcoes(null)
                    }}
                  />
                )}
                <AcaoFotoSheet
                  icone={fotoAcoes.visivel ? EyeOff : Eye}
                  rotulo={fotoProtegida(fotoAcoes) && fotoAcoes.visivel
                    ? 'Visibilidade bloqueada'
                    : fotoAcoes.visivel ? 'Ocultar da galeria' : 'Exibir na galeria'}
                  descricao={fotoProtegida(fotoAcoes) && fotoAcoes.visivel
                    ? 'Foto no pacote, baixada, editada ou em compra não pode ser ocultada.'
                    : undefined}
                  disabled={fotoProtegida(fotoAcoes) && fotoAcoes.visivel}
                  onClick={() => {
                    if (fotoProtegida(fotoAcoes) && fotoAcoes.visivel) return
                    alterarVisibilidade({ fotoId: fotoAcoes.id, visivel: !fotoAcoes.visivel })
                    setFotoAcoes(null)
                  }}
                />
                <AcaoFotoSheet
                  icone={MessageCircle}
                  rotulo="Comentários"
                  descricao={naoLidasAcoes > 0 ? `${naoLidasAcoes} não lido(s)` : 'Ver conversa do cliente'}
                  onClick={() => { setComentariosFoto(fotoAcoes); setFotoAcoes(null) }}
                />
                <AcaoFotoSheet
                  icone={fotoProtegida(fotoAcoes) ? Lock : RefreshCw}
                  rotulo={fotoProtegida(fotoAcoes) ? 'Substituição bloqueada' : 'Substituir imagem'}
                  descricao={fotoProtegida(fotoAcoes)
                    ? 'Foto no pacote, baixada, editada ou em compra não pode ser substituída.'
                    : 'Troca o arquivo mantendo número e nome'}
                  disabled={isReplacing || fotoProtegida(fotoAcoes)}
                  onClick={() => {
                    if (fotoProtegida(fotoAcoes)) return
                    handleReplaceImage(fotoAcoes.id)
                    setFotoAcoes(null)
                  }}
                />
                {papel !== 'AGENDADOR' && podeSerCapa(fotoAcoes) && (
                  <AcaoFotoSheet
                    icone={ImageIcon}
                    rotulo="Usar como capa"
                    descricao="Define esta foto como capa da galeria"
                    disabled={isDefinindoCapa}
                    onClick={() => definirCapa(fotoAcoes.id, { onSuccess: () => setFotoAcoes(null) })}
                  />
                )}
                <AcaoFotoSheet
                  icone={fotoProtegida(fotoAcoes) ? Lock : Trash2}
                  rotulo={fotoProtegida(fotoAcoes) ? 'Vinculada — não pode remover' : 'Remover foto'}
                  descricao={fotoProtegida(fotoAcoes)
                    ? 'Foto no pacote, em compra ou em edição.'
                    : 'Exclui a foto e os arquivos permanentemente.'}
                  disabled={fotoProtegida(fotoAcoes)}
                  destrutivo
                  onClick={() => {
                    if (!fotoProtegida(fotoAcoes)) {
                      setConfirmDeleteFotoId(fotoAcoes.id)
                      setFotoAcoes(null)
                    }
                  }}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDeleteFotoId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteFotoId(null) }}
        onConfirm={() => {
          if (confirmDeleteFotoId) {
            deletar(confirmDeleteFotoId)
            setConfirmDeleteFotoId(null)
          }
        }}
        title="Remover foto?"
        description="Esta ação irá deletar permanentemente a foto e seus arquivos. Esta operação não pode ser desfeita."
        confirmText="Remover"
        variant="destructive"
      />

      <ConfirmDialog
        open={confirmRenumerar}
        onOpenChange={(open) => { if (!open) setConfirmRenumerar(false) }}
        onConfirm={() => {
          renumerar(undefined, { onSuccess: () => setConfirmRenumerar(false) })
        }}
        isLoading={isRenumerando}
        title="Renumerar a galeria?"
        description="As fotos publicadas e visíveis serão renumeradas de 1 a N na ordem atual. Os números visíveis ao cliente vão mudar. Só é permitido antes de qualquer seleção, download ou compra."
        confirmText="Renumerar"
        variant="default"
      />

      <ConfirmDialog
        open={confirmDeleteLote}
        onOpenChange={(open) => { if (!open) setConfirmDeleteLote(false) }}
        onConfirm={() => {
          deletarEmLote(Array.from(selecionadas), {
            onSuccess: () => {
              setConfirmDeleteLote(false)
              setModoSelecao(false)
              setSelecionadas(new Set())
            },
            onError: () => setConfirmDeleteLote(false),
          })
        }}
        isLoading={isDeletingLote}
        title={`Remover ${selecionadas.size} foto(s)?`}
        description="Esta ação irá deletar permanentemente as fotos selecionadas e seus arquivos. Esta operação não pode ser desfeita."
        confirmText="Remover selecionadas"
        variant="destructive"
      />

      {editFoto && id && (
        <FotoMetadataDialog
          agendamentoId={id}
          foto={editFoto}
          open={!!editFoto}
          onOpenChange={(open) => { if (!open) setEditFoto(null) }}
        />
      )}

      <ComentariosDialog
        agendamentoId={id}
        foto={comentariosFoto}
        open={comentariosFoto !== null}
        onOpenChange={(open) => { if (!open) setComentariosFoto(null) }}
      />
    </div>
  )
}
