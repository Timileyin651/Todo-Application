const http = require('http');
const { Server } = require('socket.io');
const registerTaskSocket = require('./sockets/task.socket');

const app = require('./app');
const DB = require('./config/db');

const PORT = process.env.PORT;
const HOST = '0.0.0.0';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
});

//connect to db
registerTaskSocket(io);
DB.connectToMongoDB();
const { startOverdueJob } = require('./jobs/overdueJob');

startOverdueJob(io);


server.listen(PORT, ()=>{
    console.log(`Server listening on port ${PORT}`)
})