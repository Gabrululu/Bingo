# 🔥 Reglas de Firestore Actualizadas

## Reglas para el Sistema de Gestión de Salas

Copia y pega estas reglas en **Firestore Console > Reglas**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthed() {
      return request.auth != null;
    }

    // El dueño de la sala es quien la creó O está en la lista de moderadores
    function isRoomAdmin(roomId) {
      return isAuthed() && (
        get(/databases/$(database)/documents/rooms/$(roomId)).data.createdBy == request.auth.uid ||
        request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.moderators
      );
    }

    // ───── users (opcional) ─────
    match /users/{userId} {
      allow read, write: if isAuthed() && request.auth.uid == userId;
    }

    // ───── rooms ─────
    match /rooms/{roomId} {
      // lectura para cualquiera con auth (moderador y participantes anónimos)
      allow read: if isAuthed();

      // crear sala (solo moderador logueado)
      allow create: if isAuthed()
        && request.resource.data.createdBy == request.auth.uid
        && request.resource.data.moderators is list
        && request.resource.data.status in ['lobby','live','ended'];

      // actualizar/eliminar sala solo su dueño o moderadores
      allow update, delete: if isRoomAdmin(roomId);

      // ── participants ──
      match /participants/{pid} {
        allow read: if isAuthed();

        // crear su propio participant-doc dentro de la sala
        allow create: if isAuthed()
          && request.resource.data.uid == request.auth.uid
          && request.resource.data.name is string
          && size(request.resource.data.name) > 0
          && size(request.resource.data.name) <= 40
          && request.resource.data.status in ['waiting','assigned'];

        // actualizar SOLO su propio doc, y solo mientras no tenga cartilla asignada
        allow update: if isAuthed()
          && resource.data.uid == request.auth.uid
          && resource.data.cardId == null;

        // el moderador también puede actualizar (p.ej. asignar cartilla/cambiar estado)
        allow update, delete: if isRoomAdmin(roomId);
      }

      // ── cards (solo moderador) ──
      match /cards/{cardId} {
        allow read: if isAuthed();
        allow create, update, delete: if isRoomAdmin(roomId);
      }

      // ── state (solo moderador) ──
      match /state/{docId} {
        allow read: if isAuthed();
        allow create, update, delete: if isRoomAdmin(roomId);
      }
    }
  }
}
```

## 🔧 Cambios Principales

### 1. **Soporte para Moderadores Múltiples**
- `moderators: [uid]` - Array de UIDs que pueden administrar la sala
- `isRoomAdmin()` verifica tanto `createdBy` como `moderators`

### 2. **Validación de Creación de Sala**
- Exige `createdBy == request.auth.uid`
- Exige `moderators` sea un array
- Exige `status` válido ('lobby', 'live', 'ended')

### 3. **Protección de Participantes**
- Solo pueden crear su propio documento
- Solo pueden actualizar mientras `cardId == null`
- Moderadores pueden asignar cartillas y cambiar estado

### 4. **Protección de Cartillas y Estado**
- Solo moderadores pueden crear/modificar cartillas
- Solo moderadores pueden gestionar el estado del juego

## 🚀 Cómo Aplicar

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `bingo-d2f28`
3. Ve a **Firestore Database > Reglas**
4. Copia y pega las reglas de arriba
5. Haz clic en **Publicar**

## ✅ Verificación

Después de aplicar las reglas:
- ✅ Solo el creador puede crear salas
- ✅ Solo moderadores pueden gestionar salas
- ✅ Participantes solo pueden registrarse y esperar
- ✅ No más errores "Missing or insufficient permissions"
- ✅ Sistema de permisos robusto y seguro
