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

// Aktif odaları tutan obje
let activeRooms = {}; 

io.on('connection', (socket) => {
    // Bağlanan kişiye mevcut odaları gönder
    socket.emit('rooms-update', Object.values(activeRooms));

    socket.on('join-room', (roomId, userId, userName) => {
        // Oda yoksa oluştur
        if (!activeRooms[roomId]) {
            activeRooms[roomId] = { id: roomId, name: roomId, count: 0, participants: [] };
        }

        // Dolu oda kontrolü (Max 2 kişi - Flutter kuralın)
        if (activeRooms[roomId].count >= 2) {
            socket.emit('error-msg', 'Bu oda şu an dolu!');
            return;
        }

        // Odaya ekle
        activeRooms[roomId].count++;
        activeRooms[roomId].participants.push({ socketId: socket.id, userId, userName });
        
        socket.join(roomId);
        io.emit('rooms-update', Object.values(activeRooms)); // Herkese listeyi güncelle
        socket.to(roomId).emit('user-connected', userId, userName);

        socket.on('disconnect', () => {
            if (activeRooms[roomId]) {
                activeRooms[roomId].count--;
                activeRooms[roomId].participants = activeRooms[roomId].participants.filter(p => p.socketId !== socket.id);
                
                if (activeRooms[roomId].count <= 0) {
                    delete activeRooms[roomId];
                }
                io.emit('rooms-update', Object.values(activeRooms));
                socket.to(roomId).emit('user-disconnected', userId);
            }
        });
    });
});

server.listen(process.env.PORT || 3000, () => console.log("Sunucu Hazır!"));
