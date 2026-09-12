const express = require('express')
const taskRouter = express.Router();
const taskController = require('../controllers/taskController')

taskRouter.get('/', taskController.getAllTasks);
taskRouter.get('/newtask', taskController.createForm)
taskRouter.get('/:id', taskController.editForm)
taskRouter.post('/newtask',taskController.storeTask);
taskRouter.post('/:id', taskController.updateTask);
taskRouter.post('/delete/:id', taskController.deleteTask)

module.exports = taskRouter