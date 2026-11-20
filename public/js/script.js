const socket = io();
const notification = document.getElementById('notification');

let notificationTimer;

// On the edit page, #status is the <select> dropdown

// Set on the page with <body data-task-id="<%= t.id %>">
const formCard = document.querySelector(".form-card");
const taskId = formCard?.dataset.taskId;
const taskCards = document.querySelectorAll(".task-card");

function updateStatus(data) {
  console.log("Task update event received", data);
  if (!data || !data.id || !data.status) return;

  //find the corresponding task on index.ejs
  const card = document.querySelector(`.task-card[data-task-id="${data.id}"]`);
  if (!card) return;
  const statusBadge = card.querySelector(".status-badge");
  if (statusBadge) {
    statusBadge.textContent = data.status;
    statusBadge.className = `status-badge ${data.status}`;
  }

}

function showNotification(message){
  clearTimeout(notificationTimer);
  notification.textContent = message;
  notification.classList.add('show');

  //hide after 5 seconds
  notificationTimer = setTimeout(() => {
    notification.classList.remove('show');
  },5000)
}

socket.on("connect_error", (error) => {
  console.error("Socket connection failed:", error.message);
    if (error.message.startsWith("Unauthorized")) {
    window.location.href = "/login";
  }

})

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

socket.on("task:updated", updateStatus);

socket.on("task:completed",(data) => {
  showNotification(data.message)
  console.log(data)

})

if (window.flashMessage) {
    showNotification(window.flashMessage);
}
