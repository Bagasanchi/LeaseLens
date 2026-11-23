$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    node java/build.mjs
    if ($LASTEXITCODE) { exit $LASTEXITCODE }
    Write-Host 'LeaseLens Java: http://127.0.0.1:8788'
    java -cp java-output LeaseServer 8788
} finally { Pop-Location }
