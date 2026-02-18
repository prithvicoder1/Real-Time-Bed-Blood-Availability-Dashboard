import io from 'socket.io-client';

// Connect to the server
// The proxy in vite.config.js forwards /socket.io requests to localhost:5001
const socket = io('/', {
    transports: ['websocket'],
    path: '/socket.io'
});

export default socket;
