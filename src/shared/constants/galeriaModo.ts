/**
 * Glossario dos fluxos de entrega da galeria.
 *
 * - COM_EDICAO: o cliente envia a selecao e o estudio faz uma edicao EXTRA
 *   depois da selecao, publicando a versao final antes da entrega.
 *
 * - ENTREGA_DIRETA: NAO existe etapa de edicao depois da selecao. O staff
 *   apenas aprova a selecao e o cliente recebe o arquivo que ja esta publicado
 *   na galeria. Esse arquivo pode ter sido editado antes do upload; portanto,
 *   "original" aqui NAO significa "foto nao editada".
 *
 * - DIRETO: fluxo legado, mantido apenas para leitura de galerias antigas.
 *
 * Use sempre estes metadados para exibir o modo, em vez de repetir textos
 * pelos componentes.
 */
export type ModoGaleria = 'DIRETO' | 'COM_EDICAO' | 'ENTREGA_DIRETA'

export interface ModoGaleriaMeta {
  titulo: string
  resumo: string
  detalhe: string
}

export const MODO_GALERIA_META: Record<ModoGaleria, ModoGaleriaMeta> = {
  COM_EDICAO: {
    titulo: 'Editar após a seleção',
    resumo: 'O cliente escolhe as fotos e o estúdio faz uma edição extra depois da seleção.',
    detalhe: 'A entrega acontece somente depois da publicação das versões editadas.',
  },
  ENTREGA_DIRETA: {
    titulo: 'Entrega direta',
    resumo: 'Sem edição após a seleção: o cliente recebe o arquivo já publicado na galeria.',
    detalhe:
      'Se a foto foi editada antes do upload, essa edição é mantida. O staff apenas aprova a seleção.',
  },
  DIRETO: {
    titulo: 'Fluxo legado',
    resumo: 'Fluxo antigo, mantido apenas para leitura.',
    detalhe: 'Galerias antigas continuam funcionando, mas não devem usar este modo.',
  },
}
