const express = require('express');
const http = require('http');
const { ExpressPeerServer } = require('peer');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});

app.use('/peerjs', peerServer);
app.use(express.static(path.join(__dirname, 'public')));

// Oda bilgilerini tutan obje (Firebase mantığı gibi)
const rooms = {};

io.on('connection', (socket) => {
    socket.on('join-room', (roomId, userId, userName) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { participants: [] };
        }
        
        // Odaya 2'den fazla kişi girmesini engelle (Flutter kuralı)
        if (rooms[roomId].participants.length >= 2) {
            socket.emit('room-full');
            return;
        }

        rooms[roomId].participants.push({ id: userId, name: userName });
        socket.join(roomId);
        
        // Diğer kullanıcıya yeni birinin geldiğini haber ver
        socket.to(roomId).emit('user-connected', userId, userName);

        socket.on('disconnect', () => {
            rooms[roomId].participants = rooms[roomId].participants.filter(p => p.id !== userId);
            if (rooms[roomId].participants.length === 0) delete rooms[roomId];
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });

    // Aktif odaları listeleme (Flutter'daki StreamBuilder için)
    socket.on('get-active-rooms', () => {
        socket.emit('rooms-list', Object.keys(rooms).map(id => ({
            id: id,
            count: rooms[id].participants.length
        })));
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log("Konisma Sunucusu Yayında!");
});
