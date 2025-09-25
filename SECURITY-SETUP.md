# 🔒 Configuración de Seguridad - Firebase API Key

## ⚠️ Problema Actual
Tu API key de Firebase está expuesta en el código público. Esto es normal para aplicaciones web, pero debe estar protegida.

## ✅ Solución: Restricciones de Dominio

### 1. Ir a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `bingo-d2f28`
3. Ve a **Configuración del proyecto** (⚙️)

### 2. Configurar Restricciones de API Key
1. En la sección **"Claves de API web"**
2. Busca tu API key actual
3. Haz clic en **"Restringir clave"**

### 3. Agregar Dominios Autorizados
En **"Restricciones de aplicación"** → **"Referencias HTTP (sitios web)"**, agrega:

```
https://tuusuario.github.io
https://tuusuario.github.io/Bingo
http://localhost:3000
http://127.0.0.1:3000
http://localhost:8080
http://127.0.0.1:8080
```

### 4. Configurar Reglas de Firestore
Asegúrate de que tus reglas estén publicadas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthed() {
      return request.auth != null;
    }

    function isRoomOwner(roomId) {
      return isAuthed() &&
        get(/databases/$(database)/documents/rooms/$(roomId)).data.createdBy == request.auth.uid;
    }

    match /users/{userId} {
      allow read, write: if isAuthed() && request.auth.uid == userId;
    }

    match /rooms/{roomId} {
      allow read: if isAuthed();
      allow create: if isAuthed()
        && request.resource.data.createdBy == request.auth.uid
        && request.resource.data.status in ['lobby', 'live', 'ended'];
      allow update, delete: if isRoomOwner(roomId);

      match /participants/{pid} {
        allow read: if isAuthed();
        allow create: if isAuthed()
          && request.resource.data.uid == request.auth.uid
          && request.resource.data.name is string
          && size(request.resource.data.name) > 0
          && size(request.resource.data.name) <= 40
          && request.resource.data.status in ['waiting', 'assigned'];
        allow update: if isAuthed()
          && resource.data.uid == request.auth.uid
          && resource.data.cardId == null;
        allow update, delete: if isRoomOwner(roomId);
      }

      match /cards/{cardId} {
        allow read: if isAuthed();
        allow create, update, delete: if isRoomOwner(roomId);
      }

      match /state/{docId} {
        allow read: if isAuthed();
        allow create, update, delete: if isRoomOwner(roomId);
      }
    }
  }
}
```

## 🛡️ Beneficios de esta Solución

1. **API Key sigue pública** (necesario para apps web)
2. **Solo funciona desde dominios autorizados**
3. **No requiere cambios en el código**
4. **Compatible con GitHub Pages**
5. **Fácil de mantener**

## 🔍 Verificación

Después de configurar:
1. Tu app seguirá funcionando normalmente
2. Otros sitios web no podrán usar tu API key
3. Solo funcionará desde los dominios que especifiques

## 📝 Notas Importantes

- **No elimines** la API key del código
- **No uses** variables de entorno en GitHub Pages (no las soporta)
- **Las reglas de Firestore** son tu principal protección
- **La autenticación** limita el acceso a datos sensibles

## 🚨 Si Quieres Mayor Seguridad

Para proyectos más sensibles, considera:
- Usar Firebase App Check (protección adicional)
- Implementar autenticación más estricta
- Usar Cloud Functions para lógica crítica
