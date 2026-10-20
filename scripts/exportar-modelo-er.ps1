$ErrorActionPreference = 'Stop'
# Usa una instancia invisible de Word para exportar el DOCX a PDF, sin editarlo.
$erRoot = Split-Path -Parent $PSScriptRoot
$erWord = $null
$erDoc = $null
try {
    $erWord = New-Object -ComObject Word.Application
    $erWord.Visible = $false
    $erWord.DisplayAlerts = 0
    $erDoc = $erWord.Documents.Open((Join-Path $erRoot 'output\docx\modelo-entidad-relacion-salud.docx'), $false, $true)
    $erDoc.ExportAsFixedFormat((Join-Path $erRoot 'output\pdf\modelo-entidad-relacion-salud.pdf'), 17)
    Write-Output 'PDF exportado desde el documento Word'
}
finally {
    if ($null -ne $erDoc) { $erDoc.Close(0) }
    if ($null -ne $erWord) { $erWord.Quit() }
}
