import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WizardPersistedData {
  clienteId?: string
  nome?: string
  telefone?: string
  email?: string
  cpf?: string
  cidade?: string
  estado?: string
  origem?: string
  observacoes?: string
  pacoteId?: string
  data?: string
  hora?: string
  localEnsaio?: string
  enderecoCompleto?: string
  editorId?: string
  custoDeslocamento?: number
  repassarDeslocamento?: boolean
  autorizaUsoImagem?: boolean
  indicadorId?: string
  indicadorNome?: string
  indicadorTelefone?: string
}

interface WizardState {
  formData: WizardPersistedData
  currentStep: number
  comprovanteName: string | null
  confirmado: boolean
  rascunhoId: string | null
  setFormData: (data: Partial<WizardPersistedData>) => void
  setCurrentStep: (step: number) => void
  setComprovanteName: (name: string | null) => void
  setConfirmado: (confirmed: boolean) => void
  setRascunhoId: (id: string | null) => void
  reset: () => void
}

const initialState = {
  formData: {},
  currentStep: 0,
  comprovanteName: null,
  confirmado: false,
  rascunhoId: null,
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      ...initialState,
      setFormData: (data) =>
        set((state) => ({ formData: { ...state.formData, ...data } })),
      setCurrentStep: (step) => set({ currentStep: step }),
      setComprovanteName: (name) => set({ comprovanteName: name }),
      setConfirmado: (confirmed) => set({ confirmado: confirmed }),
      setRascunhoId: (id) => set({ rascunhoId: id }),
      reset: () => set(initialState),
    }),
    { name: 'photoizer-wizard-draft' },
  ),
)
