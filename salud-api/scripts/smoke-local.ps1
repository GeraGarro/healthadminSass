#Requires -Version 7.0
param([string]$BaseUrl = 'http://localhost:8080')
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    $config = @{}
    Get-Content -LiteralPath '.env' | ForEach-Object { if ($_ -match '^([A-Z_]+)=(.*)$') { $config[$Matches[1]]=$Matches[2] } }
    $csrf = Invoke-RestMethod "$BaseUrl/api/v1/auth/csrf" -SessionVariable session
    $headers = @{ 'X-CSRF-TOKEN' = $csrf.token }
    $login = @{email='paciente@demo.test';password=$config.BOOTSTRAP_PASSWORD} | ConvertTo-Json
    $null = Invoke-RestMethod "$BaseUrl/api/v1/auth/login" -Method Post -ContentType 'application/json' -Body $login -WebSession $session -Headers $headers
    $csrf = Invoke-RestMethod "$BaseUrl/api/v1/auth/csrf" -WebSession $session
    $headers['X-CSRF-TOKEN'] = $csrf.token
    $me = Invoke-RestMethod "$BaseUrl/api/v1/auth/me" -WebSession $session
    $tenant = @($me.entities)[0].id
    # El fixture local contiene un único paciente; su identificador se descubre
    # mediante los alcances personales, sin acceso administrativo a fichas ajenas.
    $access = Invoke-RestMethod "$BaseUrl/api/v1/my-patients/$tenant" -WebSession $session
    $patient = @($access)[0].id
    $agendas = Invoke-RestMethod "$BaseUrl/api/v1/entities/$tenant/agendas?patientId=$patient" -WebSession $session
    $agenda = @($agendas)[0].id
    $offers = Invoke-RestMethod "$BaseUrl/api/v1/entities/$tenant/agendas/$agenda/offers?patientId=$patient" -WebSession $session
    $offer = @($offers | Where-Object { $_.base_inicial -eq 'CONSULTA' -and $_.portal_habilitado })[0].id
    # Horario AR 11:00 dentro de 7 días; variar día para repetir una prueba concurrente.
    $start = [DateTimeOffset]::new([DateTime]::Today.AddDays(7).AddHours(11), [TimeSpan]::FromHours(-3)).ToUniversalTime().ToString('o')
    $headers['Idempotency-Key'] = 'smoke-' + [Guid]::NewGuid().ToString('N')
    $body = @{patientId=$patient;offerVersionId=$offer;start=$start} | ConvertTo-Json
    $hold = Invoke-RestMethod "$BaseUrl/api/v1/entities/$tenant/holds" -Method Post -ContentType 'application/json' -Body $body -WebSession $session -Headers $headers
    $headers['Idempotency-Key'] = 'book-' + [Guid]::NewGuid().ToString('N')
    $booking = Invoke-RestMethod "$BaseUrl/api/v1/entities/$tenant/appointments" -Method Post -ContentType 'application/json' -Body (@{holdId=$hold.id}|ConvertTo-Json) -WebSession $session -Headers $headers
    $headers['If-Match'] = '"' + $booking.version_concurrencia + '"'
    $null = Invoke-RestMethod "$BaseUrl/api/v1/entities/$tenant/appointments/$($booking.id)/confirm" -Method Post -WebSession $session -Headers $headers
    $final = Invoke-RestMethod "$BaseUrl/api/v1/entities/$tenant/appointments/$($booking.id)" -WebSession $session
    if ($final.estado_asistencia -ne 'CONFIRMADA') { throw 'La asistencia no se confirmó.' }
    $headers['If-Match'] = '"' + $final.version_concurrencia + '"'
    $null = Invoke-RestMethod "$BaseUrl/api/v1/entities/$tenant/appointments/$($booking.id)/cancel" -Method Post -ContentType 'application/json' -Body '{"reason":"Fin de prueba automática local"}' -WebSession $session -Headers $headers
    Write-Host 'OK: login, CSRF, contexto, pre-reserva, turno, confirmación, consulta y cancelación.'
} finally { Pop-Location }
