param(
    [string]$BaseUrl = 'http://localhost:5080',
    [string]$Email = 'worker1@example.test',
    [string]$Password = 'Demo123!'
)
$ErrorActionPreference = 'Stop'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$token = Invoke-RestMethod -Uri "$BaseUrl/api/auth/csrf" -WebSession $session
$headers = @{ 'X-CSRF-TOKEN' = $token.token }
$body = @{ email = $Email; password = $Password } | ConvertTo-Json
$null = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" -WebSession $session -Headers $headers -ContentType 'application/json' -Body $body
# Login changes identity, so request a token bound to the authenticated session.
$token = Invoke-RestMethod -Uri "$BaseUrl/api/auth/csrf" -WebSession $session
$headers = @{ 'X-CSRF-TOKEN' = $token.token }
$result = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/test/reset" -WebSession $session -Headers $headers -ContentType 'application/json' -Body '{}'
Write-Output $result.message
