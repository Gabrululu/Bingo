# Script para subir Bingo Web3 a GitHub Pages
# Ejecutar en PowerShell como administrador

Write-Host "🎯 Configurando Bingo Web3 para GitHub Pages..." -ForegroundColor Green

# Verificar si Git está instalado
try {
    git --version | Out-Null
    Write-Host "✅ Git encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Git no está instalado. Instálalo desde: https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# Navegar al directorio del proyecto
$projectPath = "D:\0xProyectos\bingo"
Set-Location $projectPath

Write-Host "📁 Directorio actual: $(Get-Location)" -ForegroundColor Yellow

# Inicializar Git si no existe
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Inicializando repositorio Git..." -ForegroundColor Yellow
    git init
}

# Añadir todos los archivos
Write-Host "📦 Añadiendo archivos..." -ForegroundColor Yellow
git add .

# Hacer commit
Write-Host "💾 Haciendo commit..." -ForegroundColor Yellow
git commit -m "Deploy: Bingo Web3 app ready for production"

# Mostrar instrucciones para conectar con GitHub
Write-Host ""
Write-Host "🚀 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Ve a GitHub.com y crea un nuevo repositorio" -ForegroundColor White
Write-Host "2. Copia la URL del repositorio" -ForegroundColor White
Write-Host "3. Ejecuta estos comandos:" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Ve a Settings > Pages en tu repositorio" -ForegroundColor White
Write-Host "5. Selecciona 'Deploy from a branch' > 'main'" -ForegroundColor White
Write-Host "6. ¡Tu sitio estará en https://TU-USUARIO.github.io/TU-REPO!" -ForegroundColor White
Write-Host ""

# Crear archivo ZIP como backup
Write-Host "📦 Creando archivo ZIP de backup..." -ForegroundColor Yellow
$zipPath = "D:\0xProyectos\bingo-web3-backup.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}
Compress-Archive -Path "D:\0xProyectos\bingo\*" -DestinationPath $zipPath
Write-Host "✅ Backup creado en: $zipPath" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
Write-Host "📋 Archivos listos para subir:" -ForegroundColor Cyan
Get-ChildItem -Recurse | Where-Object { $_.Name -match '\.(html|css|js|svg|md)$' } | ForEach-Object {
    Write-Host "   $($_.FullName.Replace($projectPath, '.'))" -ForegroundColor Gray
}

Write-Host ""
Write-Host "💡 Alternativa rápida: Arrastra la carpeta a netlify.com" -ForegroundColor Magenta
