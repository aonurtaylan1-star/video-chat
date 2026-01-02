const express = require('express');
const { ExpressPeerServer } = require('peer');
const path = require('path');
const app = express();

const server = app.listen(process.env.PORT || 3000);

// PeerServer ayarları
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});

app.use('/peerjs', peerServer);
app.use(express.static(path.join(__dirname, 'public')));

// Odadaki kullanıcı sayılarını tutmak için basit bir nesne
const rooms = {};

peerServer.on('connection', (client) => {
    // Yeni biri bağlandığında yapılacaklar (isteğe bağlı)
});

peerServer.on('disconnect', (client) => {
    // Ayrıldığında oda listesinden düşme mantığı buraya eklenebilir
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

console.log("Sunucu modern modda çalışıyor...");
