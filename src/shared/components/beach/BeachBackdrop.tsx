import { cn } from '@/shared/lib/cn'

interface BeachBackdropProps {
  className?: string
}

export function BeachBackdrop({ className }: BeachBackdropProps) {
  return (
    <div aria-hidden className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-cyan-100 to-amber-50" />

      <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-amber-300/60 blur-3xl" />
      <div className="absolute top-32 -left-24 h-80 w-80 rounded-full bg-cyan-300/40 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-teal-200/50 blur-3xl" />

      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 96C240 32 480 32 720 80C960 128 1200 128 1440 72V160H0Z"
          className="fill-cyan-300/50"
        />
        <path
          d="M0 128C240 72 480 72 720 112C960 152 1200 152 1440 104V160H0Z"
          className="fill-cyan-400/40"
        />
      </svg>
    </div>
  )
}
