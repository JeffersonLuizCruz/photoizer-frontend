function baixarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function celula(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return '""'
  return `"${String(valor).replace(/"/g, '""')}"`
}

export function exportarCSV(
  filename: string,
  header: string[],
  rows: (string | number | null | undefined)[][],
) {
  const linhas = [header, ...rows].map((l) => l.map(celula).join(';'))
  const csv = `\uFEFF${linhas.join('\n')}`
  baixarBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

function escaparXML(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return ''
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function exportarXLS(
  filename: string,
  header: string[],
  rows: (string | number | null | undefined)[][],
) {
  const dados = [header, ...rows].map(
    (l) =>
      `<Row>${l
        .map((c) => `<Cell><Data ss:Type="String">${escaparXML(c)}</Data></Cell>`)
        .join('')}</Row>`,
  )
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Relatorio">
<Table>${dados.join('')}</Table>
</Worksheet>
</Workbook>`
  baixarBlob(new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' }), filename)
}
