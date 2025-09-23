# 🎯 Bingo Web3 - MKT Community

Un bingo interactivo diseñado específicamente para comunidades de marketing y blockchain, con términos de Web3, DeFi, NFT y más.

## 🚀 Características

- **Modo Participante**: Registro fácil y cartillas personalizadas
- **Modo Moderador**: Control completo del juego con estadísticas
- **Términos Web3**: Más de 90 términos de blockchain y marketing
- **Responsive**: Optimizado para móviles y escritorio
- **Persistencia**: Los datos se guardan en localStorage
- **Efectos Visuales**: Animaciones y feedback táctil

## 📁 Estructura del Proyecto

```
bingo/
├── index.html              # Página principal
├── favicon.svg             # Favicon del proyecto
├── assets/
│   ├── css/
│   │   └── styles.css      # Estilos CSS
│   └── js/
│       └── app.js          # Lógica JavaScript
└── README.md               # Este archivo
```

## 🎮 Cómo Jugar

### Para Participantes:
1. Abre la aplicación en tu navegador
2. Selecciona "🎮 Participante"
3. Ingresa tu nombre y regístrate
4. Espera a que el moderador asigne cartillas
5. Marca los términos cuando sean cantados
6. ¡Grita BINGO cuando tengas línea completa!

### Para Moderadores:
1. Selecciona "🎯 Moderador"
2. Registra participantes (pueden registrarse desde cualquier dispositivo)
3. Asigna cartillas a todos los participantes
4. Inicia el juego
5. Canta términos uno por uno
6. Verifica ganadores

## 🛠️ Instalación y Uso

### Opción 1: Uso Local
1. Descarga todos los archivos
2. Abre `index.html` en tu navegador
3. ¡Listo para jugar!

### Opción 2: Servidor Web
1. Sube todos los archivos a tu servidor web
2. Asegúrate de mantener la estructura de carpetas
3. Accede desde cualquier dispositivo

### Opción 3: GitHub Pages
1. Sube el proyecto a un repositorio de GitHub
2. Activa GitHub Pages en la configuración
3. Tu bingo estará disponible en `https://tu-usuario.github.io/tu-repo`

## 🌐 Despliegue en la Web

### Netlify (Recomendado)
1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta del proyecto a la zona de deploy
3. Tu sitio estará disponible en una URL como `https://random-name.netlify.app`
4. Puedes personalizar el dominio en la configuración

### Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Deploy automático en cada push

### GitHub Pages
1. Sube el código a GitHub
2. Ve a Settings > Pages
3. Selecciona la rama main
4. Tu sitio estará en `https://tu-usuario.github.io/nombre-repo`

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge
- ✅ iOS Safari, Chrome Mobile
- ✅ Android Chrome, Samsung Internet
- ✅ Responsive design para todas las pantallas

## 🎨 Personalización

### Cambiar Términos
Edita el array `WEB3_MARKETING_TERMS` en `assets/js/app.js`:

```javascript
const WEB3_MARKETING_TERMS = [
    "Tu término 1",
    "Tu término 2",
    // ... más términos
];
```

### Cambiar Colores
Modifica las variables CSS en `assets/css/styles.css`:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #ff6b6b;
}
```

### Cambiar Logo/Texto
Edita el contenido en `index.html`:

```html
<div class="community-name">TU COMUNIDAD</div>
<h1>TU BINGO</h1>
<p>Tu descripción</p>
```

## 🔧 Funcionalidades Técnicas

- **LocalStorage**: Persistencia de datos entre sesiones
- **Touch Events**: Soporte completo para dispositivos táctiles
- **Responsive Grid**: Cartillas adaptables a cualquier pantalla
- **Progressive Enhancement**: Funciona sin JavaScript (básico)
- **SEO Ready**: Meta tags optimizados para redes sociales

## 🐛 Solución de Problemas

### El favicon no aparece
- Verifica que `favicon.svg` esté en la raíz del proyecto
- Limpia la caché del navegador

### Los datos no se guardan
- Verifica que localStorage esté habilitado
- No uses modo incógnito para el moderador

### Problemas en móvil
- Asegúrate de usar HTTPS en producción
- Verifica que el viewport meta tag esté presente

## 📄 Licencia

Este proyecto es de código abierto. Úsalo libremente para tu comunidad.

## 🤝 Contribuciones

¿Tienes ideas para mejorar el bingo? ¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:
- Abre un issue en GitHub
- Contacta a la comunidad MKT

---

**¡Disfruta jugando Bingo Web3! 🎉**
