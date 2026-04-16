# Requiere: PowerShell "Ejecutar como administrador"
# Uso: .\recuperar_password_postgres.ps1
#      O con contrasena en linea (evita caracteres ' en la clave):
#      .\recuperar_password_postgres.ps1 -NuevaClave "MiClaveSegura123"

param(
    [string]$NuevaClave = "postgres"
)

$ErrorActionPreference = "Stop"

$data = "C:\Program Files\PostgreSQL\16\data"
$hba = Join-Path $data "pg_hba.conf"
$pgCtl = "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe"
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: ejecuta PowerShell como Administrador (clic derecho -> Ejecutar como administrador)." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $hba)) {
    Write-Host "No se encontro pg_hba.conf en $hba" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($NuevaClave)) {
    $secure = Read-Host "Escribe la NUEVA contrasena para el usuario postgres" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $NuevaClave = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
}

if ([string]::IsNullOrWhiteSpace($NuevaClave)) {
    Write-Host "Contrasena vacia. Cancelado." -ForegroundColor Red
    exit 1
}

# Escapar comillas simples para SQL: ' -> ''
$sqlPass = $NuevaClave -replace "'", "''"

$bak = "$hba.bak_antes_reset_$(Get-Date -Format yyyyMMdd_HHmmss)"
Copy-Item -Path $hba -Destination $bak -Force
Write-Host "Respaldo: $bak"

# Sustituir scram-sha-256 por trust solo en lineas generales (no replication)
$lines = Get-Content -Path $hba -Encoding UTF8
$newLines = foreach ($line in $lines) {
    if ($line -match '^\s*local\s+all\s+all\s+scram-sha-256\s*$') {
        'local   all             all                                     trust'
    }
    elseif ($line -match '^\s*host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256\s*$') {
        'host    all             all             127.0.0.1/32            trust'
    }
    elseif ($line -match '^\s*host\s+all\s+all\s+::1/128\s+scram-sha-256\s*$') {
        'host    all             all             ::1/128                 trust'
    }
    else {
        $line
    }
}
Set-Content -Path $hba -Value $newLines -Encoding UTF8

Write-Host "Recargando configuracion de PostgreSQL..."
& $pgCtl reload -D $data

Start-Sleep -Seconds 2

Write-Host "Cambiando contrasena del usuario postgres..."
$sql = "ALTER USER postgres WITH PASSWORD '$sqlPass';"
& $psql -U postgres -h 127.0.0.1 -d postgres -c $sql

Write-Host "Creando base biblioteca_api si aun no existe (puede avisar si ya existe, es normal)..."
& $psql -U postgres -h 127.0.0.1 -d postgres -c "CREATE DATABASE biblioteca_api;"

Write-Host "Restaurando pg_hba.conf (scram-sha-256)..."
Copy-Item -Path $bak -Destination $hba -Force
& $pgCtl reload -D $data

Write-Host ""
Write-Host "Listo. Prueba:" -ForegroundColor Green
Write-Host '  set PGPASSWORD=TU_NUEVA_CLAVE'
Write-Host '  "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d biblioteca_api -h 127.0.0.1'
Write-Host ""
Write-Host "Usa -h 127.0.0.1 si localhost te resuelve a IPv6 y quieres evitar confusiones."
