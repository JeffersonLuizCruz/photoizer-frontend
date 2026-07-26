import { useState, useEffect, useRef } from 'react'
import { apiClient } from '@/shared/api/client'
import { cn } from '@/shared/lib/cn'

interface AuthImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  fallback?: string
}

export function AuthImage({ src, fallback, className, alt, ...props }: AuthImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!src) {
      setLoading(false)
      setError(true)
      return
    }

    abortRef.current?.abort()
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }

    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(false)

    const apiPath = src.startsWith('/api/v1') ? src.slice(7) : src
    apiClient
      .get(apiPath, { responseType: 'blob', signal: controller.signal })
      .then((res) => {
        const url = URL.createObjectURL(res.data)
        objectUrlRef.current = url
        setBlobUrl(url)
        setLoading(false)
      })
      .catch((err) => {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        setError(true)
        setLoading(false)
      })

    return () => {
      controller.abort()
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [src])

  if (loading) {
    return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
  }

  if (error || !blobUrl) {
    if (fallback) {
      return (
        <img
          src={fallback}
          alt={alt ?? ''}
          className={className}
          {...props}
        />
      )
    }
    return (
      <div
        className={cn('flex items-center justify-center bg-muted text-muted-foreground', className)}
      >
        <span className="text-xs">Erro ao carregar</span>
      </div>
    )
  }

  return (
    <img
      src={blobUrl}
      alt={alt ?? ''}
      className={className}
      {...props}
    />
  )
}
