param([switch]$DatabaseOnly)
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    if (-not (Test-Path -LiteralPath '.env')) {
        $lines = Get-Content -LiteralPath '.env.example'
        $lines = $lines | ForEach-Object {
            if ($_ -match '^(POSTGRES_PASSWORD|DB_PASSWORD|DB_MIGRATION_PASSWORD)=') {
                $key = $Matches[1]
                $secret = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
                "$key=$secret"
            } else { $_ }
        }
        [IO.File]::WriteAllLines((Join-Path (Get-Location) '.env'), [string[]]$lines)
        Write-Host 'Configuración local creada con credenciales aleatorias en .env (ignorado por Git).'
    }
    # Completa claves incorporadas en versiones posteriores, sin sobrescribir secretos existentes.
    $existingKeys = @(Get-Content -LiteralPath '.env' | ForEach-Object { if ($_ -match '^([A-Z_]+)=') { $Matches[1] } })
    $additions = @()
    if ('APP_ENCRYPTION_KEY' -notin $existingKeys) { $additions += 'APP_ENCRYPTION_KEY=' + [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)) }
    if ('BOOTSTRAP_PASSWORD' -notin $existingKeys) { $additions += 'BOOTSTRAP_PASSWORD=' + [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24)) }
    if ('BOOTSTRAP_EMAIL' -notin $existingKeys) { $additions += 'BOOTSTRAP_EMAIL=admin@demo.test' }
    if ('DEMO_ENABLED' -notin $existingKeys) { $additions += 'DEMO_ENABLED=true' }
    if ($additions.Count -gt 0) { Add-Content -LiteralPath '.env' -Value $additions }
    Get-Content -LiteralPath '.env' | ForEach-Object {
        if ($_ -match '^([A-Z_]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
        }
    }
    & docker compose up -d --wait
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar PostgreSQL. Revisar Docker Desktop y el puerto.' }
    if (-not $DatabaseOnly) {
        if (-not $env:JAVA_HOME -and (Test-Path -LiteralPath 'C:\Program Files\Java\jdk-21.0.12')) { $env:JAVA_HOME = 'C:\Program Files\Java\jdk-21.0.12' }
        Write-Host 'Usuarios ficticios: admin@demo.test, profesional@demo.test, paciente@demo.test y secretaria@demo.test.'
        Write-Host 'Contraseña local: consultar BOOTSTRAP_PASSWORD en .env. API: http://localhost:8080'
        & .\mvnw.cmd spring-boot:run
        if ($LASTEXITCODE -ne 0) { throw 'Falló el arranque de Spring Boot.' }
    }
} finally { Pop-Location }
