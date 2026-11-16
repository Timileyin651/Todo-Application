const { transports } = require("winston");

const socket = io("https://todo-application-tyzy.onrender.com",{
  transports: ["websocket","polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
});

// On the edit page, #status is the <select> dropdown

// Set on the page with <body data-task-id="<%= t.id %>">
const formCard = document.querySelector(".form-card");
const taskId = formCard?.dataset.taskId;
const taskCards = document.querySelectorAll(".task-card");

function updateStatus(data) {
  console.log("Task update event received", data);
  if (!data || !data.id || !data.status) return;

  //fibd the corresponding task on index.ejs
  const card = document.querySelector(`.task-card[data-task-id="${data.id}"]`);
  if (!card) return;
  const statusBadge = document.querySelector(".status-badge");
  if (statusBadge) {
    statusBadge.textContent = data.status;
    statusBadge.className = `status-badge ${data.status}`;
  }
//   const title = card.querySelector(".task-card__title");
//   if (title) title.classList.toggle("is-done", data.status === "Completed");
}

// 'connect' also fires after a reconnect, when rooms are lost, so re-join every time
socket.on("connect", () => {
  console.log("Connected", socket.id);
  //individual edit page
  if (taskId) {
    console.log("Joining task room:", taskId);
    socket.emit("task:join", { taskId });
  }

  //index
  taskCards.forEach((card) => {
    socket.emit("task:join", { taskId: card.dataset.taskId });
  });
});


socket.on("connect_error", (error) => {
  console.log("Connection error:", error.message);
});

socket.on("task:updated", updateStatus);
