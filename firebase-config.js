// Firebase Configuration - PROYECTO REAL CONFIGURADO
// Proyecto: bingo-d2f28

const firebaseConfig = {
    apiKey: "AIzaSyCgWVgfDgYOLCXvMoI6B8cKtc1lt0E2jOc",
    authDomain: "bingo-d2f28.firebaseapp.com",
    projectId: "bingo-d2f28",
    storageBucket: "bingo-d2f28.firebasestorage.app",
    messagingSenderId: "786733165579",
    appId: "1:786733165579:web:a5339c73eaf1d31c3eeb0e",
    measurementId: "G-17C462BPND"
};

// Instrucciones para configurar Firebase:
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un nuevo proyecto
// 3. Habilita Authentication (Google)
// 4. Habilita Firestore Database
// 5. Copia la configuración aquí
// 6. Actualiza el archivo assets/js/app.js con estos valores

// Reglas de Firestore recomendadas:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer/escribir sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Salas: moderador puede escribir, participantes pueden leer
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource.data.moderatorId == request.auth.uid || 
         !resource.exists);
    }
    
    // Participantes: pueden leer/escribir sus propios datos
    match /participants/{participantId} {
      allow read, write: if request.auth != null;
    }
  }
}
*/
