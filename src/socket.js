import io from "socket.io-client";

const SOCKET_URL = `https://polizolserver.medme.uz`;
const headers = { transports: ["websocket"] };
const socket = io(SOCKET_URL, headers);

export default socket;
