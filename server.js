const express = require('express');
const { ExpressPeerServer } = require('peer');
const app = express();
const path = require('path');

const server = app.listen(process.env.PORT || 3000);

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/myapp'
});

app.use('/peerjs', peerServer);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

console.log("Sunucu çalışıyor...");
