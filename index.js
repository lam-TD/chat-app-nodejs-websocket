const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require('morgan')
const _CONST = require('./app/config/constant')
const app = express();
const http = require('http');
const db = require("./app/models");
db.sequelize.sync();
var session = require('express-session')

var corsOptions = {
    origin: "http://localhost:8081" // co thể sau này nó là resfult api, cứ để sẵn
}
app.use(morgan('combined')) //theo dõi log GET, POST...
app.use(cors(corsOptions)); //cross domain...

app.use(express.static('public', { 'extensions': ['jsx'] }));
app.set('view engine', 'ejs');
app.use(session({
    secret: 'keyboard cat',
    cookie: { maxAge: 60000 },
    saveUninitialized: true,
    resave: false,
}));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

require('./app/routes/')(app); //importing route
require("./app/routes/users.route")(app);


const PORT = process.env.PORT || _CONST.PORT;
var server = http.createServer(app).listen(PORT, function () {
    console.log("Express server listening on port " + PORT);
});

var io = require('socket.io')(server);

let numUsers = 0;
let numUserConnected = 0;
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