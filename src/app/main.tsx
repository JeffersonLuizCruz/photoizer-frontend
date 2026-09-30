import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import '@/shared/api/interceptors'
import '@/styles/globals.css'

const updateSW = registerSW({
  onNeedRefresh() {
    toast('Nova versão disponível', {
      description: 'Atualize para carregar a versão mais recente.',
      duration: Number.POSITIVE_INFINITY,
      action: {
        label: 'Atualizar',
        onClick: () => updateSW(true),
      },
    })
  },
  onOfflineReady() {
    toast.success('Pronto para uso offline')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
