const express = require("express");
const Task = require("../models/tasks");
const STATUSES = ["All", "Pending", "Completed", "Deleted"];
// const logger = require('./utils/logger')

const getAllTasks = async (req, res, next) => {
  try {
    const requestedStatus = req.query.status;
    const isValidStatus = STATUSES.includes(requestedStatus);

    const filter = {
      user: req.user._id,
      ...(isValidStatus ? { status: requestedStatus } : {}),
    };
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.render("tasks/index", {
      tasks: tasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description,
        status: t.status,
      })),
    });
  } catch (error) {
    logger.log(error);
    res.status(500).json({
      message: error,
    });
  }
};

const createForm = async (req, res) => {
  res.render("tasks/new");
};

const storeTask = async (req, res) => {
  try {
    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      user: req.user._id,
      end_at: req.body.endsAt,
    });
    res.redirect("/tasks");
  } catch (error) {
    logger.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { status, endsAt } = req.body;

    const compTask = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        $set: {
          status,
          endsAt,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );
    if (!compTask) {
      return res.status(404).send("Task not found");
    }
    if (status === "Completed") {
      console.log("Step 1: Entered completed condition");

      const room = `user:${req.user._id}`;
      console.log("room", room);

      const io = req.app.get("io");

      io.to(`user:${req.user._id}`).emit("task:completed", {
        message: `Congratulations! You completed "${compTask.title}"`,
        taskId: compTask._id,
      });

      // Send flash message to the tab submitting the form
      req.flash(
        "success",
        `Congratulations! You completed "${compTask.title}"`,
      );

      console.log("Step 4: Notification emitted");
    }
    res.redirect("/tasks");
  } catch (error) {
    logger.log(error);
    res.status(500).json({
      message: error,
    });
  }
};

const editForm = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    res.render("tasks/edit", { task });
  } catch (error) {
    logger.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    res.redirect("/tasks");
  } catch (error) {
    logger.log(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getAllTasks,
  storeTask,
  updateTask,
  deleteTask,
  createForm,
  editForm,
};
