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

    socket.on("task:join", (payload) => {
      const { taskId } = payload || {};
      if (taskId) {
        socket.join(getSocketRoom(taskId));
        console.log(`Socket ${socket.id} joind task:${taskId}`)
      }
    });
    socket.on("task:status", async (payload, callback) => {
      try {
        const { taskId } = payload || {};
        await broadcastRoom(io, taskId);
        callback?.({
          success: true,
          message: "Task updated successfully",
        });
      } catch (error) {
        callback?.({
          success: false,
          message: error.message,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Disconnected: ${socket.id}`);
    });
  });
}

module.exports = registerTaskSocket;
module.exports.broadcastRoom = broadcastRoom;
