const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.use(express.json());

let users = [];
let messages = [];

app.get('/api/users', (req, res) => res.json(users));
app.post('/api/users', (req, res) => {
    const user = req.body;
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) users.push(user);
    else users[idx] = user;
    res.json({ success: true });
});

io.on('connection', (socket) => {
    console.log('User connected');
    socket.emit('load messages', messages);
    socket.on('chat message', (msg) => {
        messages.push(msg);
        io.emit('chat message', msg);
    });
    socket.on('drawing', (data) => io.emit('drawing', data));
    socket.on('disconnect', () => console.log('User disconnected'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
