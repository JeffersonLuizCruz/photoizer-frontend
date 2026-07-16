import { useState, useCallback, useRef, type ChangeEvent } from 'react'
import { Upload, X, File } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'

interface FilePreview {
  file: File
  preview: string
}

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  onFilesChange?: (files: File[]) => void
  className?: string
  label?: string
  disabled?: boolean
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024

function isImage(file: File): boolean {
  return file.type.startsWith('image/')
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  accept = 'image/*,.pdf,.doc,.docx',
  multiple = false,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = 5,
  onFilesChange,
  className,
  label = 'Arraste arquivos ou clique para selecionar',
  disabled,
}: FileUploadProps) {
  const [files, setFiles] = useState<FilePreview[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

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
        if (file.size > maxSize) {
          errors.push(`${file.name}: Arquivo muito grande (máx. ${formatFileSize(maxSize)})`)
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
      }))

      const updated = multiple ? [...files, ...previews] : previews
      setFiles(updated)
      onFilesChange?.(updated.map((f) => f.file))
    },
    [files, maxFiles, maxSize, multiple, onFilesChange],
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          'hover:border-primary/50 hover:bg-muted/50',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {accept.replace(/,/g, ', ')} - até {formatFileSize(maxSize)}
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
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <File className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{filePreview.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(filePreview.file.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
                disabled={disabled}
                aria-label={`Remover ${filePreview.file.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
