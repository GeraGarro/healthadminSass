#Requires -Version 7.0
param([switch]$SkipInstall,[switch]$SkipHttp)
$ErrorActionPreference='Stop'
$repo=Split-Path -Parent $PSScriptRoot
$fixture=$null
New-Item -ItemType Directory -Force -Path (Join-Path $repo 'tmp') | Out-Null
function Check-Exit([string]$stage) { if($LASTEXITCODE -ne 0){throw "Falló: $stage (código $LASTEXITCODE)."} }
Push-Location $repo
try {
    Push-Location 'salud-web'
    try {
        if(-not $SkipInstall){ & npm ci; Check-Exit 'instalación reproducible' }
        & npm run verify:strict; Check-Exit 'Angular, cobertura, dependencias y producción'
    } finally { Pop-Location }
    Push-Location 'salud-api'
    try {
        & .\mvnw.cmd -B -ntp --strict-checksums clean verify; Check-Exit 'Java y PostgreSQL'
        if(-not $SkipHttp){
            if(Get-NetTCPConnection -LocalPort 18080 -State Listen -ErrorAction SilentlyContinue){throw 'El puerto 18080 ya está ocupado. Detené la fixture anterior antes de repetir la prueba.'}
            & .\mvnw.cmd -B -ntp test-compile dependency:build-classpath '-DincludeScope=test' '-Dmdep.outputFile=target/strict-classpath.txt'; Check-Exit 'classpath de fixture'
            $classpath='target/test-classes;target/classes;'+(Get-Content -Raw 'target/strict-classpath.txt').Trim()
            $java=if($env:JAVA_HOME){Join-Path $env:JAVA_HOME 'bin/java.exe'}else{'java'}
            $fixture=Start-Process -FilePath $java -ArgumentList @('-cp',('"'+$classpath+'"'),'ar.com.salud.StrictTestApplication') -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -RedirectStandardOutput (Join-Path $repo 'tmp/strict-server.log') -RedirectStandardError (Join-Path $repo 'tmp/strict-server-errors.log') -PassThru
            $ready=$false
            for($attempt=0;$attempt -lt 90;$attempt++){
                if($fixture.HasExited){throw 'La fixture finalizó antes de estar lista. Revisá tmp/strict-server-errors.log.'}
                try{$response=Invoke-WebRequest 'http://127.0.0.1:18080/actuator/health' -TimeoutSec 2;if($response.Headers['X-Salud-Test-Fixture'] -eq 'disposable-postgres-mfa'){$ready=$true;break}}catch{}
                Start-Sleep -Seconds 1
            }
            if(-not $ready){throw 'La fixture no estuvo lista dentro de 90 segundos.'}
            & node (Join-Path $repo 'scripts/strict-http.mjs'); Check-Exit 'recorridos HTTP con MFA'
        }
    } finally { Pop-Location }
    Write-Host 'Verificación estricta aprobada. Los informes quedan en salud-web/coverage, salud-web/test-results, salud-api/target y tmp.'
} finally {
    if($fixture -and -not $fixture.HasExited){$fixture.Kill($true);$fixture.WaitForExit()}
    Pop-Location
}
