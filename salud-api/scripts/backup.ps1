#Requires -Version 7.0
param([string]$EnvFile='.env.production',[string]$ComposeFile='compose.production.yml')
$ErrorActionPreference='Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    $directory=Join-Path (Get-Location) 'backups'
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
    $name='salud-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.dump'
    & docker compose --env-file $EnvFile -f $ComposeFile exec -T postgres pg_dump -U postgres -d salud --format=custom --file="/tmp/$name"
    if($LASTEXITCODE -ne 0){throw 'Falló pg_dump.'}
    & docker compose --env-file $EnvFile -f $ComposeFile cp "postgres:/tmp/$name" (Join-Path $directory $name)
    if($LASTEXITCODE -ne 0){throw 'Falló la copia del respaldo.'}
    & docker compose --env-file $EnvFile -f $ComposeFile exec -T postgres rm -- "/tmp/$name"
    Get-FileHash -LiteralPath (Join-Path $directory $name) -Algorithm SHA256 | Select-Object Path,Hash
    Write-Host 'Guardar el respaldo en almacenamiento externo cifrado junto con APP_ENCRYPTION_KEY mediante un gestor de secretos.'
} finally {Pop-Location}
