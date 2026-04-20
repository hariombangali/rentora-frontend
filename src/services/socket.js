import { io } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

let socket = null;
let currentToken = null;

export function getSocket() {
  const token = localStorage.getItem("token");

  // If the token changed (e.g. after login/logout) reset the connection.
  if (socket && token !== currentToken) {
    try { socket.disconnect(); } catch (e) { /* ignore */ }
    socket = null;
  }

  if (!socket) {
    currentToken = token;
    socket = io(SOCKET_URL, {
      auth: { token: token || "" },
      transports: ["websocket"],
      reconnection: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    try { socket.disconnect(); } catch (e) { /* ignore */ }
    socket = null;
    currentToken = null;
  }
}
