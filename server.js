const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));

let users = [];
let messages = [];

// API
app.get('/api/users', (req, res) => res.json(users));
app.post('/api/users', (req, res) => {
    const user = req.body;
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) users.push(user);
    else users[idx] = user;
    res.json({ success: true });
});

function recalcUserPoints() {
    const pointsMap = new Map();
    messages.forEach(msg => {
        if (msg.type === 'drawing' && msg.totalScore && msg.senderId) {
            pointsMap.set(msg.senderId, (pointsMap.get(msg.senderId) || 0) + msg.totalScore);
        }
    });
    users.forEach(u => {
        u.pointsFromDrawings = pointsMap.get(u.id) || 0;
    });
}

io.on('connection', (socket) => {
    console.log('New user connected');
    socket.emit('load messages', messages);

    socket.on('chat message', (msg) => {
        msg.type = 'text';
        messages.push(msg);
        io.emit('chat message', msg);
    });

    socket.on('drawing', (data) => {
        data.type = 'drawing';
        data.ratings = {};
        data.totalScore = 0;
        messages.push(data);
        io.emit('drawing', data);
    });

    socket.on('voice message', (data) => {
        data.type = 'voice';
        messages.push(data);
        io.emit('voice message', data);
    });

    socket.on('image message', (data) => {
        data.type = 'image';
        messages.push(data);
        io.emit('image message', data);
    });

    socket.on('delete message', ({ msgId, userId }) => {
        const idx = messages.findIndex(m => m.id === msgId && m.senderId === userId);
        if (idx !== -1) {
            messages.splice(idx, 1);
            io.emit('message deleted', msgId);
        }
    });

    socket.on('rate drawing', ({ msgId, rating, userId }) => {
        const msg = messages.find(m => m.id === msgId);
        if (msg && msg.type === 'drawing' && !msg.ratings[userId]) {
            const score = parseInt(rating);
            if (score >= 1 && score <= 10) {
                msg.ratings[userId] = score;
                let total = 0;
                for (let k in msg.ratings) total += msg.ratings[k];
                msg.totalScore = total;
                recalcUserPoints();
                io.emit('drawing rated', { msgId, totalScore: msg.totalScore });
                io.emit('update leaderboard');
            }
        }
    });

    socket.on('disconnect', () => console.log('User disconnected'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
