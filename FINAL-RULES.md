# 🔥 Reglas de Firestore - Versión Final Corregida

## Reglas Exactas (Copia y Pega en Firebase Console)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthed() { return request.auth != null; }

    function isRoomAdmin(roomId) {
      return isAuthed() && (
        get(/databases/$(database)/documents/rooms/$(roomId)).data.createdBy == request.auth.uid ||
        request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.moderators
      );
    }

    // opcional
    match /users/{userId} {
      allow read, write: if isAuthed() && request.auth.uid == userId;
    }

    match /rooms/{roomId} {
      // lectura para cualquiera autenticado (incluye anónimos)
      allow read: if isAuthed();

      // crear sala (moderador)
      allow create: if isAuthed()
        && request.resource.data.createdBy == request.auth.uid
        && request.resource.data.moderators is list
        && request.resource.data.status in ['lobby','live','ended'];

      // actualizar/eliminar sala (owner o moderador)
      allow update, delete: if isRoomAdmin(roomId);

      // ── participants ──
      match /participants/{pid} {
        allow read: if request.auth != null;

        allow create: if request.auth != null
          && pid == request.auth.uid
          && request.resource.data.uid == request.auth.uid
          && request.resource.data.name is string
          && size(request.resource.data.name) > 0
          && size(request.resource.data.name) <= 40
          && request.resource.data.status in ['waiting','assigned']
          && (!('cardId' in request.resource.data) || request.resource.data.cardId == null);

        allow update: if request.auth != null
          && resource.data.uid == request.auth.uid
          && resource.data.cardId == null;

        // el admin de la sala también puede actualizar/eliminar
        allow update, delete: if isRoomAdmin(roomId);
      }

      // ── cards ──
      match /cards/{cardId} {
        allow read: if isAuthed();
        allow create, update, delete: if isRoomAdmin(roomId);
      }

      // ── state ──
      match /state/{docId} {
        allow read: if isAuthed();
        allow create, update, delete: if isRoomAdmin(roomId);
      }
    }
  }
}
```

## 🔧 Cambios Clave

**Líneas 33-40**: Reglas simplificadas para participants:
- ✅ `request.auth != null` (más simple que `isAuthed()`)
- ✅ `pid == request.auth.uid` (docID = uid)
- ✅ Validación explícita de `cardId` null o ausente
- ✅ Status `waiting`/`assigned` válido

## 🧪 Prueba en Rules Playground

**Auth uid**: `TEST123`
**Ruta create**: `/rooms/6CZ6ZBG0B6pKTuYI2bw7/participants/TEST123`
**Data**:
```json
{
  "uid": "TEST123",
  "name": "Franco",
  "status": "waiting",
  "cardId": null
}
```

**Resultado esperado**: ✅ ALLOW

## 🚀 Aplicar Cambios

1. **Copia las reglas de arriba**
2. **Firebase Console → Firestore → Reglas**
3. **Pega y haz clic en Publish**
4. **Prueba el registro de participantes**

## ✅ Verificación

Después de aplicar las reglas, el log `JOIN ->` debería mostrar:
```javascript
{
  path: "rooms/6CZ6ZBG0B6pKTuYI2bw7/participants/DwYsrlf...",
  payload: {
    uid: "DwYsrlf...",
    name: "Juan",
    status: "waiting",
    cardId: null
  }
}
```

Y el registro debería funcionar sin errores de permisos.
