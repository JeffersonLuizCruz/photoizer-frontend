import { useState, useCallback, useRef } from 'react'
import { Upload, X, File, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'

type FileStatus = 'pending' | 'uploading' | 'done' | 'error'

interface FilePreview {
  file: File
  preview: string
  status: FileStatus
}

interface EdicaoUploaderProps {
  accept?: string
  multiple?: boolean
  maxFiles?: number
  onFilesChange?: (files: File[]) => void
  onUpload?: () => void
  isUploading?: boolean
  uploadProgress?: number
  className?: string
  label?: string
  disabled?: boolean
}

function isImage(file: File): boolean {
  return file.type.startsWith('image/')
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function EdicaoUploader({
  accept = 'image/*',
  multiple = false,
  maxFiles = 500,
  onFilesChange,
  onUpload,
  isUploading,
  uploadProgress,
  className,
  label = 'Arraste arquivos ou clique para selecionar',
  disabled,
}: EdicaoUploaderProps) {
  const [files, setFiles] = useState<FilePreview[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const totalArquivos = files.length
  const enviados = totalArquivos > 0 && uploadProgress !== undefined
    ? Math.round((uploadProgress / 100) * totalArquivos)
    : 0

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return

      const newFiles: File[] = []
      const errors: string[] = []

      Array.from(fileList).forEach((file) => {
        if (files.length + newFiles.length >= maxFiles) {
          errors.push(`Limite máximo de ${maxFiles} arquivo(s)`)
          return
        }
        newFiles.push(file)
      })

      if (errors.length > 0) {
        errors.forEach((msg) => console.warn(msg))
      }

      const previews = newFiles.map((file) => ({
        file,
        preview: isImage(file) ? URL.createObjectURL(file) : '',
        status: 'pending' as FileStatus,
      }))

      const updated = multiple ? [...files, ...previews] : previews
      setFiles(updated)
      onFilesChange?.(updated.map((f) => f.file))
    },
    [files, maxFiles, multiple, onFilesChange],
  )

  const removeFile = useCallback(
    (index: number) => {
      const updated = files.filter((_, i) => i !== index)
      files[index]?.preview && URL.revokeObjectURL(files[index].preview)
      setFiles(updated)
      onFilesChange?.(updated.map((f) => f.file))
    },
    [files, onFilesChange],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      processFiles(e.dataTransfer.files)
    },
    [processFiles],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          'hover:border-primary/50 hover:bg-muted/50',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {accept.replace(/,/g, ', ')}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {isUploading && uploadProgress !== undefined && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{enviados} de {totalArquivos} arquivos</span>
            <span className="font-medium">{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((filePreview, index) => (
            <li
              key={`${filePreview.file.name}-${index}`}
              className="flex items-center gap-3 rounded-md border bg-card p-2"
            >
              {filePreview.preview ? (
                <img
                  src={filePreview.preview}
                  alt={filePreview.file.name}
                  className="h-12 w-12 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted">
                  <File className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{filePreview.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(filePreview.file.size)}</p>
              </div>
              <div className="flex shrink-0 items-center">
                {isUploading && index < enviados && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
                {isUploading && index === enviados && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
                {isUploading && index > enviados && (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                )}
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={disabled}
                    aria-label={`Remover ${filePreview.file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && onUpload && (
        <Button onClick={onUpload} disabled={isUploading || disabled} className="w-full">
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando... {enviados}/{totalArquivos}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Enviar {files.length} arquivo(s)
            </>
          )}
        </Button>
      )}
    </div>
  )
}
