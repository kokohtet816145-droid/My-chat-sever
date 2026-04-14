const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// In-memory data (ဖုန်းပေါ်က စမ်းသပ်တုန်းက localStorage လိုပါပဲ၊ ဒါပေမယ့် Server မှာ သိမ်းတယ်)
let users = [];
let messages = [];
let messageReactions = {};

// အောက်ပါ Code က မနက်က Frontend ရဲ့ အင်္ဂါရပ်တွေအတွက် API endpoints တွေ ထည့်ပေးထားပါတယ်
app.get('/api/users', (req, res) => {
    res.json(users);
});

app.post('/api/users', express.json(), (req, res) => {
    const user = req.body;
    const existing = users.find(u => u.id === user.id);
    if (!existing) {
        users.push(user);
    } else {
        Object.assign(existing, user);
    }
    res.json({ success: true });
});

// Socket.io events (အချိန်နဲ့တပြေးညီ စကားပြောဖို့)
io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('chat message', (msg) => {
        console.log('Message: ' + msg);
        io.emit('chat message', msg);
    });

    socket.on('drawing', (drawingData) => {
        io.emit('drawing', drawingData);
    });

    socket.on('rating', (ratingData) => {
        io.emit('rating', ratingData);
    });

    socket.on('reaction', (reactionData) => {
        io.emit('reaction', reactionData);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
