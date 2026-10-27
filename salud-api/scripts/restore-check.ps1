#Requires -Version 7.0
param([Parameter(Mandatory)][string]$BackupFile)
$ErrorActionPreference='Stop'
$file=(Resolve-Path -LiteralPath $BackupFile).Path
$containerName='salud-restore-check-'+[Guid]::NewGuid().ToString('N')
$oldPassword=$env:POSTGRES_PASSWORD
$env:POSTGRES_PASSWORD=[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
$containerId=$null
try {
    $containerId=(& docker run -d --name $containerName --env POSTGRES_PASSWORD --tmpfs /var/lib/postgresql postgres:18.6).Trim()
    if($LASTEXITCODE -ne 0 -or $containerId -notmatch '^[a-f0-9]{64}$'){throw 'No se pudo crear el contenedor aislado.'}
    $ready=$false
    for($i=0;$i -lt 40;$i++){
        & docker exec $containerId pg_isready -U postgres *> $null
        if($LASTEXITCODE -eq 0){$ready=$true;break}
        Start-Sleep -Milliseconds 500
    }
    if(-not $ready){throw 'PostgreSQL de restauración no inició.'}
    & docker exec $containerId psql -U postgres -v ON_ERROR_STOP=1 -c 'CREATE ROLE salud_app; CREATE ROLE salud_migrator;'
    & docker exec $containerId createdb -U postgres salud
    & docker cp $file "${containerId}:/tmp/restore.dump"
    if($LASTEXITCODE -ne 0){throw 'No se pudo copiar el respaldo.'}
    & docker exec $containerId pg_restore -U postgres -d salud --no-owner --no-privileges --exit-on-error /tmp/restore.dump
    if($LASTEXITCODE -ne 0){throw 'Falló el ensayo de restauración.'}
    & docker exec $containerId psql -U postgres -d salud -v ON_ERROR_STOP=1 -c "SELECT count(*) AS tablas FROM pg_tables WHERE schemaname='salud'; SELECT count(*) AS turnos FROM salud.turno; SELECT count(*) AS restricciones_invalidas FROM pg_constraint WHERE connamespace='salud'::regnamespace AND NOT convalidated;"
    if($LASTEXITCODE -ne 0){throw 'Falló la verificación del respaldo restaurado.'}
    Write-Host 'OK: restauración lógica en PostgreSQL aislado, sin puertos publicados. No se modificó la base de origen.'
} finally {
    if($containerId -match '^[a-f0-9]{64}$'){ & docker rm -f $containerId | Out-Null }
    $env:POSTGRES_PASSWORD=$oldPassword
}
