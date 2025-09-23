# Comandos para subir el Bingo Web3 a la web

## 🚀 Opción 1: Netlify (Más fácil)

### Pasos:
1. Ve a https://netlify.com
2. Haz clic en "Add new site" > "Deploy manually"
3. Arrastra toda la carpeta `bingo` a la zona de deploy
4. ¡Listo! Tu sitio estará disponible en una URL como `https://random-name.netlify.app`

### Comando para crear ZIP (opcional):
```bash
# En PowerShell (Windows)
Compress-Archive -Path "D:\0xProyectos\bingo\*" -DestinationPath "bingo-web3.zip"

# En CMD (Windows)
powershell Compress-Archive -Path "D:\0xProyectos\bingo\*" -DestinationPath "bingo-web3.zip"
```

## 🌐 Opción 2: GitHub Pages

### Comandos para subir a GitHub:

```bash
# 1. Inicializar Git (si no está inicializado)
cd "D:\0xProyectos\bingo"
git init

# 2. Añadir todos los archivos
git add .

# 3. Hacer commit inicial
git commit -m "Initial commit: Bingo Web3 app"

# 4. Conectar con repositorio remoto (cambia 'tu-usuario' y 'tu-repo')
git remote add origin https://github.com/tu-usuario/tu-repo.git

# 5. Subir a GitHub
git branch -M main
git push -u origin main
```

### Después de subir a GitHub:
1. Ve a tu repositorio en GitHub
2. Settings > Pages
3. Source: "Deploy from a branch"
4. Branch: "main" / "root"
5. Save
6. Tu sitio estará en: `https://tu-usuario.github.io/tu-repo`

## ⚡ Opción 3: Vercel

### Comandos:
```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. En la carpeta del proyecto
cd "D:\0xProyectos\bingo"
vercel

# 3. Seguir las instrucciones en pantalla
```

## 🔧 Opción 4: Servidor propio

### Comandos para servidor Apache/Nginx:
```bash
# Copiar archivos al servidor
scp -r "D:\0xProyectos\bingo\*" usuario@tu-servidor.com:/var/www/html/bingo/

# O usando rsync
rsync -av "D:\0xProyectos\bingo/" usuario@tu-servidor.com:/var/www/html/bingo/
```

## 📱 Comandos útiles para desarrollo:

```bash
# Servidor local simple (Python)
cd "D:\0xProyectos\bingo"
python -m http.server 8000

# Servidor local (Node.js)
npx http-server "D:\0xProyectos\bingo" -p 8000

# Servidor local (PHP)
cd "D:\0xProyectos\bingo"
php -S localhost:8000
```

## ✅ Verificación después del deploy:

```bash
# Verificar que todos los archivos estén presentes
curl -I https://tu-sitio.com/index.html
curl -I https://tu-sitio.com/favicon.svg
curl -I https://tu-sitio.com/assets/css/styles.css
curl -I https://tu-sitio.com/assets/js/app.js
```

## 🎯 Recomendación:

**Para empezar rápido: Usa Netlify**
1. Ve a netlify.com
2. Arrastra la carpeta `bingo`
3. ¡Listo en 30 segundos!

**Para proyecto profesional: Usa GitHub Pages**
1. Crea repo en GitHub
2. Ejecuta los comandos de Git
3. Activa Pages en Settings
4. ¡URL personalizable!
