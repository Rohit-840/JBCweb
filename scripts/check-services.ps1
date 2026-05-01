$ApiUrl = $env:API_URL
if (-not $ApiUrl) { $ApiUrl = "http://127.0.0.1:3000/health" }

$Mt5Url = $env:MT5_URL
if (-not $Mt5Url) { $Mt5Url = "http://127.0.0.1:8001/" }

Write-Host "Checking API: $ApiUrl"
Invoke-WebRequest -UseBasicParsing $ApiUrl | Out-Null
Write-Host "API OK"

Write-Host "Checking MT5 bridge: $Mt5Url"
Invoke-WebRequest -UseBasicParsing $Mt5Url | Out-Null
Write-Host "MT5 bridge OK"
