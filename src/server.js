const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const {Server} = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');

const users = {};
let onlineUsers = 0;

const io = new Server(httpServer, {
    path: '/socket.io',
    cors: '*'
});

io.on('connection', (socket) => {
    io.emit('live-users-count-update', {count: Object.keys(users).length});
    // Events for a single user/socket/connection
    // console.log(`Client connected with id: ${socket.id}`);
    socket.on('joined', (data) => {
        const name = data.name;
        users[socket.id] = name;
        console.log(users);
        onlineUsers++;
        socket.broadcast.emit('on-joined', {message: `${name} has joined the chat.`, name: name});
        io.emit('live-users-count-update', {count: Object.keys(users).length});
    });
    socket.on('send', (data) => {
        const message = data.message;
        const name = data.name;
        // console.log(message, name);
        socket.broadcast.emit('recieve', {message: message, name: users[socket.id], time: data.time});
    });
    socket.on('disconnect', (reason) => {
        // console.log(`Client disconnected with id: ${socket.id}`);
        if (users[socket.id]) {
            socket.broadcast.emit('leave', {message: reason, name: users[socket.id]});
        }
        delete users[socket.id];
        onlineUsers--;
        io.emit('live-users-count-update', {count: Object.keys(users).length});
        console.log(users);
    });
});

app.use(cors());
if (app.get('env') === 'development') {
    console.log('Enabling morgan request logger...');
    app.use(morgan('dev'));
}

app.get('/onlineusers', (req, res, next) => {
    const usersJoined = Object.keys(users).length;
    res.status(200).json({count: usersJoined});
});

const port = process.env.PORT || 3000;
httpServer.listen(port, console.log(`Server Listening on port: ${port}`));
