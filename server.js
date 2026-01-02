const express = require('express');
const http = require('http');
const { ExpressPeerServer } = require('peer');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const peerServer = ExpressPeerServer(server, { debug: true, path: '/' });
app.use('/peerjs', peerServer);
app.use(express.static(path.join(__dirname, 'public')));

let activeRooms = {}; 

io.on('connection', (socket) => {
    socket.emit('rooms-update', Object.values(activeRooms));

    socket.on('join-room', (roomId, userId, userName) => {
        if (!activeRooms[roomId]) {
            activeRooms[roomId] = { id: roomId, creator: userName, count: 0, participants: {} };
        }

        if (activeRooms[roomId].count >= 2) {
            socket.emit('error-msg', 'Bu oda dolu!');
            return;
        }

        activeRooms[roomId].count++;
        activeRooms[roomId].participants[userId] = userName;
        
        socket.join(roomId);
        io.emit('rooms-update', Object.values(activeRooms));

        // Odadaki diğer kişilere yeni gelenin ID ve ismini gönder
        socket.to(roomId).emit('user-connected', userId, userName);

        socket.on('disconnect', () => {
            if (activeRooms[roomId]) {
                activeRooms[roomId].count--;
                delete activeRooms[roomId].participants[userId];
                if (activeRooms[roomId].count <= 0) delete activeRooms[roomId];
                io.emit('rooms-update', Object.values(activeRooms));
                socket.to(roomId).emit('user-disconnected', userId);
            }
        });
    });
});

server.listen(process.env.PORT || 3000);
