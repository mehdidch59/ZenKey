// socket.js
import { io } from "socket.io-client";

// Remplace par l'IP de ton backend
const socket = io("http://172.22.17.141:5000");

export default socket;
