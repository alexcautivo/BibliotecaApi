# Cierra procesos que escuchan en los puertos indicados (ej: .\kill-ports.ps1 8000 4200)
param(
    [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)]
    [int[]]$Ports
)
$ErrorActionPreference = 'SilentlyContinue'
foreach ($port in $Ports) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object {
            $owningPid = $_.OwningProcess
            Write-Host "Puerto $port -> terminando PID $owningPid"
            Stop-Process -Id $owningPid -Force -ErrorAction SilentlyContinue
        }
}
