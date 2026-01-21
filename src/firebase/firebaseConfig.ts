import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAhf0Q-ssP8Dim8Nr-oTgDBwztZsP9Aqrs",
    authDomain: "lisappi.firebaseapp.com",
    projectId: "lisappi",
    storageBucket: "lisappi.firebasestorage.app",
    messagingSenderId: "636992449128",
    appId: "1:636992449128:web:b3b4d6b13ebdaca00f69dd",
    measurementId: "G-T87VF6FS0G"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)