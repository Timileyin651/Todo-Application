const Task = require("../models/tasks");
function getSocketRoom(taskId) {
  return `task:${taskId}`;
}

async function getTaskData(taskId) {
  const task = await Task.findById(taskId).populate("user", "email");
  if (!task) {
    return null;
  }

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    user: {
      email: task.user?.email,
    },
    end_at: task.end_at,
  };
}

async function broadcastRoom(io, taskId) {
  const taskData = await getTaskData(taskId);
  console.log("Broadcasting task:", taskData);

  if (taskData) {
    io.to(getSocketRoom(taskId)).emit("task:updated", taskData);
  }
}

function registerTaskSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Connected: ${socket.id}`);

    socket.join(`user:${socket.user.userId}`);
    console.log("Joined rooms:", Array.from(socket.rooms));
    console.log("JWT user ID:", socket.user.userId);
    console.log(`User joined notification room: user:${socket.user.userId} `);

    socket.on("task:join", async (payload, callback) => {
      try {
        const { taskId } = payload || {};
        if (!taskId) {
          return callback?.({
            success: false,
            message: "Task ID is required",
          });
        }
        //verify authenticated user
        const task = await Task.findOne({
          _id: taskId,
          user: socket.user.userId,
        });

        if (!task) {
          return callback?.({
            success: false,
            message: "access denied",
          });
        }
        socket.join(getSocketRoom(taskId));
        console.log(`Socket ${socket.id} joined task:${taskId}`);

        return callback?.({
          success: true,
          message: "Successfully joined task room",
        });
      } catch (error) {
        console.error("Task join error:", error);

        callback?.({
          success: false,
          message: "Unable to join task room",
        });
      }
    });
    //might remove
    // socket.on("task:status", async (payload, callback) => {
    //   try {
    //     const { taskId } = payload || {};
    //     await broadcastRoom(io, taskId);
    //     callback?.({
    //       success: true,
    //       message: "Task updated successfully",
    //     });
    //   } catch (error) {
    //     callback?.({
    //       success: false,
    //       message: error.message,
    //     });
    //   }
    // });

    socket.on("disconnect", () => {
      console.log(`Disconnected: ${socket.id}`);
      // console.log(`Reason: ${reason}`);
    });
  });
}

module.exports = registerTaskSocket;
module.exports.broadcastRoom = broadcastRoom;
