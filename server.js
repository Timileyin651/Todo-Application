const http = require("http");
const { Server } = require("socket.io");
const registerTaskSocket = require("./sockets/task.socket");
const cors = require("cors");

const app = require("./app");
const DB = require("./config/db");

const PORT = process.env.PORT;
const HOST = "0.0.0.0";

const server = http.createServer(app);
const io = new Server(server);
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
    process.exit(1);
  }
}

startServer();
