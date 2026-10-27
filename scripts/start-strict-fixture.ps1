$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Push-Location (Join-Path $repo 'salud-api')
try {
    & .\mvnw.cmd -B -ntp test-compile dependency:build-classpath '-DincludeScope=test' '-Dmdep.outputFile=target/strict-classpath.txt'
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar la fixture.' }
    $classpath = 'target/test-classes;target/classes;' + (Get-Content -Raw 'target/strict-classpath.txt').Trim()
    $java = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin/java.exe' } else { 'java' }
    & $java '-cp' $classpath 'ar.com.salud.StrictTestApplication'
    if ($LASTEXITCODE -ne 0) { throw 'La fixture finalizó con errores.' }
} finally { Pop-Location }
