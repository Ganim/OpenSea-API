# ==================================
# Setup JWT RS256 Keys (PowerShell)
# ==================================
# Este script gera as chaves RSA e mostra como configura-las no .env

$ErrorActionPreference = "Stop"

$KEYS_DIR = "keys"

Write-Host "[KEY] Gerando chaves JWT RS256..." -ForegroundColor Cyan
Write-Host ""

# Criar diretorio se nao existir
if (!(Test-Path $KEYS_DIR)) {
    New-Item -ItemType Directory -Path $KEYS_DIR | Out-Null
}

# Gerar chaves
openssl genrsa -out "$KEYS_DIR/private.pem" 2048 2>$null
openssl rsa -in "$KEYS_DIR/private.pem" -pubout -out "$KEYS_DIR/public.pem" 2>$null

Write-Host "[OK] Chaves geradas em $KEYS_DIR/" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Adicione as seguintes variaveis ao seu .env:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# ==========================================" -ForegroundColor DarkGray
Write-Host "# JWT RS256 Keys" -ForegroundColor DarkGray
Write-Host "# ==========================================" -ForegroundColor DarkGray

# Converter para uma unica linha
$privateKey = (Get-Content "$KEYS_DIR/private.pem" -Raw) -replace "`r`n", "\n" -replace "`n", "\n"
$publicKey = (Get-Content "$KEYS_DIR/public.pem" -Raw) -replace "`r`n", "\n" -replace "`n", "\n"

# Remover \n extra no final
$privateKey = $privateKey.TrimEnd("\n")
$publicKey = $publicKey.TrimEnd("\n")

Write-Host "JWT_PRIVATE_KEY=`"$privateKey`"" -ForegroundColor White
Write-Host ""
Write-Host "JWT_PUBLIC_KEY=`"$publicKey`"" -ForegroundColor White
Write-Host ""
Write-Host "# ==========================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "[!] IMPORTANTE: Nunca commite as chaves no repositorio!" -ForegroundColor Red
Write-Host "    As chaves estao em: $KEYS_DIR/" -ForegroundColor Gray
Write-Host "    O diretorio $KEYS_DIR/ ja esta no .gitignore" -ForegroundColor Gray

# Gerar AUDIT_HMAC_SECRET
Write-Host ""
Write-Host "[INFO] AUDIT_HMAC_SECRET (opcional):" -ForegroundColor Yellow
$hmacSecret = openssl rand -base64 32
Write-Host "AUDIT_HMAC_SECRET=$hmacSecret" -ForegroundColor White
