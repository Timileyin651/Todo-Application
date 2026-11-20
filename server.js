const http = require("http");
const { Server } = require("socket.io");
const registerTaskSocket = require("./sockets/task.socket");
const jwt = require('jsonwebtoken');
const cookie = require('cookie');


const app = require("./app");
const DB = require("./config/db");

const PORT = process.env.PORT;
const HOST = "0.0.0.0";

const server = http.createServer(app);

const io = new Server(server);



app.set("io", io);

io.use((socket, next) => {
  //read cookies form the handshake request
  const cookies = cookie.parse(
    socket.handshake.headers.cookie || ""
  );

  //extract jwt
  const token = cookies.token;
  if(!token){
    return next(new Error("Unauthorized: Token missen"))
  }
  console.log(token)

  //verify jwy
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET
  );
  //attach authenticated user to socket
  socket.user = decoded;

  next();
})

const { startOverdueJob } = require("./jobs/overdueJob");


//connect to db
registerTaskSocket(io);
async function startServer() {
  try {
    await DB.connectToMongoDB();
    startOverdueJob(io);

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
  }
}

startServer().catch(error => {
  console.error('Server failed to start:', error)
});
