import { useState, useEffect, useRef } from 'react'
import { apiClient } from '@/shared/api/client'
import { cn } from '@/shared/lib/cn'

interface AuthImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  fallback?: string
  /** Carrega imediatamente, sem esperar o IntersectionObserver (ex.: capa). */
  priority?: boolean
}

export function AuthImage({ src, fallback, className, alt, priority = false, ...props }: AuthImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shouldLoad, setShouldLoad] = useState(priority)
  const abortRef = useRef<AbortController | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Galerias grandes têm centenas de miniaturas: só busca a imagem quando ela
  // se aproxima da viewport. `priority` mantém capa/hero imediatos.
  useEffect(() => {
    if (shouldLoad) return
    const elemento = containerRef.current
    if (!elemento || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    observer.observe(elemento)
    return () => observer.disconnect()
  }, [shouldLoad])

  useEffect(() => {
    if (!shouldLoad) return
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
        objectUrlRef.current = null
      }
    }
  }, [src, shouldLoad])

  if (!shouldLoad) {
    return <div ref={containerRef} className={cn('animate-pulse rounded-md bg-muted', className)} />
  }

  if (loading) {
    return <div ref={containerRef} className={cn('animate-pulse rounded-md bg-muted', className)} />
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
      loading={priority ? 'eager' : 'lazy'}
      {...props}
    />
  )
}
