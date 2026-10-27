#Requires -Version 7.0
param([switch]$BackendOnHost, [switch]$NoBuild)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Push-Location $repo
try {
    if (-not (Test-Path -LiteralPath '.env')) {
        $lines = Get-Content -LiteralPath '.env.example' | ForEach-Object {
            if ($_ -match '^(POSTGRES_PASSWORD|DB_PASSWORD|DB_MIGRATION_PASSWORD|BOOTSTRAP_PASSWORD)=') {
                $key = $Matches[1]
                "$key=$([Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24)))"
            } elseif ($_ -match '^APP_ENCRYPTION_KEY=') {
                'APP_ENCRYPTION_KEY=' + [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
            } else { $_ }
        }
        [IO.File]::WriteAllLines((Join-Path $repo '.env'), [string[]]$lines)
        Write-Host 'Configuración creada en .env con secretos aleatorios (ignorada por Git).'
    }
    $composeFile = if ($BackendOnHost) { 'compose.host-api.yml' } else { 'compose.yml' }
    & docker compose --env-file .env -f $composeFile config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Revisá la configuración de .env.' }
    $arguments = @('compose', '--env-file', '.env', '-f', $composeFile, 'up', '-d', '--wait', '--wait-timeout', '240')
    if (-not $NoBuild) { $arguments += '--build' }
    & docker @arguments
    if ($LASTEXITCODE -ne 0) { throw "No se pudo iniciar el entorno. Revisá: docker compose --env-file .env -f $composeFile logs --tail 100" }
    # Read only the public port. Never print generated passwords or the rendered Compose model.
    $webPort = '4387'
    Get-Content -LiteralPath '.env' | ForEach-Object { if ($_ -match '^WEB_PORT=(\d+)$') { $webPort = $Matches[1] } }
    if ($env:WEB_PORT) { $webPort = $env:WEB_PORT }
    Write-Host "Patio: http://127.0.0.1:$webPort"
    if ($BackendOnHost) {
        Write-Host 'El frontend usa el servicio Spring del host. Revisá también su disponibilidad y PORTAL_URL.'
    } else {
        Write-Host 'Cuentas: admin@demo.test, secretaria@demo.test, profesional@demo.test y paciente@demo.test.'
        Write-Host 'Contraseña local: BOOTSTRAP_PASSWORD en el archivo .env de la raíz.'
    }
} finally { Pop-Location }
