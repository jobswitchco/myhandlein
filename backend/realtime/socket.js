import { io } from "socket.io-client";

// ⚠️ DO NOT auto-connect
let socket = null;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem("tokenMyhandleProf"); // or however you store JWT

    socket = io("https://api.myhandle.in", {
      transports: ["websocket"],       // force websocket (prod best practice)
      autoConnect: false,               // manual control
      auth: {
        token,                          // goes to socketAuth middleware
      },
      withCredentials: true,
    });
  }

  return socket;
}
