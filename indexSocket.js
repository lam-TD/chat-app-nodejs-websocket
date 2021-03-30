// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log('Server listening at port %d', port);
    console.log(`http://localhost:${port}`);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));


app.get('/chat', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/login.html'))
})
// Chatroom

let numUsers = 0;
let numUserConnected = 0;

const login = (username, password) => {
    const fs = require('fs');
    let rawdata = fs.readFileSync('db-json/users.json');
    let users = JSON.parse(rawdata);
    const result = users.find(user => user.username == username && user.password == password)
    if(typeof result == "undefined") {
        console.log('Username or password incorect');
        return false;
    } else {
        console.log(`${username} login successful`);
        return true
    }
        
}
io.on('connection', (socket) => {
    let addedUser = false;
    ++numUserConnected;
    console.log('new user connected')
    // when the client emits 'new message', this listens and executes
    socket.on('new message', (data) => {
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', (username) => {
        if (addedUser) return;

        if (!login(username, "1232132")) {
            console.log('socket.broadcast.emit login failed')
            socket.emit('login failed', {
                username: username,
                message: 'Login faild'
            });
            return;
        }

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});