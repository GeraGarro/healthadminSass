#Requires -Version 7.0
param([switch]$Restart)
$ErrorActionPreference='Stop'
$staffRepo=Split-Path -Parent $PSScriptRoot
$staffApi=Join-Path $staffRepo 'salud-api'
$staffJar=Join-Path $staffApi 'target/salud-api-0.0.1-SNAPSHOT.jar'
$staffEnv=Join-Path $staffApi '.env'
$staffJava='C:\Program Files\Java\jdk-21.0.12\bin\java.exe'
if(!(Test-Path -LiteralPath $staffJar)){throw 'Compilá primero la API con Java 21 y mvnw package.'}
if(!(Test-Path -LiteralPath $staffJava)){throw 'Configurá la ruta de Java 21 en este script.'}
if(!(Test-Path -LiteralPath $staffEnv)){throw 'Falta salud-api/.env con la configuración local.'}
foreach($staffLine in Get-Content -LiteralPath $staffEnv){
    if($staffLine -match '^([A-Z_][A-Z0-9_]*)=(.*)$'){
        [Environment]::SetEnvironmentVariable($Matches[1],$Matches[2].Trim().Trim('"').Trim("'"),'Process')
    }
}
if($env:SPRING_PROFILES_ACTIVE -ne 'local'){throw 'Este script está limitado al perfil local.'}
$staffPort=if($env:SERVER_PORT){[int]$env:SERVER_PORT}else{8080}
$staffListener=Get-NetTCPConnection -State Listen -LocalPort $staffPort -ErrorAction SilentlyContinue | Select-Object -First 1
if($staffListener){
    if(!$Restart){throw "El puerto $staffPort ya está ocupado. Usá -Restart para actualizar esta API."}
    $staffProcess=Get-CimInstance Win32_Process -Filter "ProcessId=$($staffListener.OwningProcess)"
    if($staffProcess.Name -ne 'java.exe' -or !$staffProcess.CommandLine.Contains($staffRepo) -or $staffProcess.CommandLine -notmatch 'ar\.com\.salud|salud-api.*\.jar'){
        throw 'El proceso de ese puerto no se reconoce como la API de este proyecto. No se detuvo.'
    }
    Stop-Process -Id $staffProcess.ProcessId
    for($staffAttempt=0;$staffAttempt -lt 20;$staffAttempt++){
        if(!(Get-NetTCPConnection -State Listen -LocalPort $staffPort -ErrorAction SilentlyContinue)){break}
        Start-Sleep -Milliseconds 250
    }
}
$staffLogDir=Join-Path $staffRepo 'output'
New-Item -ItemType Directory -Force -Path $staffLogDir | Out-Null
$staffRuntimeJar=Join-Path $staffLogDir ('salud-api-local-'+[DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')+'.jar')
Copy-Item -LiteralPath $staffJar -Destination $staffRuntimeJar
$staffStarted=Start-Process -FilePath $staffJava -ArgumentList @('-jar',('"'+$staffRuntimeJar+'"')) -WorkingDirectory $staffApi -WindowStyle Hidden -RedirectStandardOutput (Join-Path $staffLogDir 'roles-api.stdout.log') -RedirectStandardError (Join-Path $staffLogDir 'roles-api.stderr.log') -PassThru
Write-Host "API local iniciada: proceso $($staffStarted.Id), puerto $staffPort."
