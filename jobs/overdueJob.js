const cron = require("node-cron");
const Task = require("../models/tasks");
const logger = require("../utils/logger");
const { SendOverDueEmail } = require("../utils/mailer");
const { broadcastRoom } = require("../sockets/task.socket");

let isRunning = false;

async function markOverDueTasks(io) {
  if (isRunning) return;
  isRunning = true;
  try {
    //get all overdue id's
    const dueTasks = await Task.find({
      status: "Pending",
      end_at: { $lte: new Date() },
    }).select("_id");
    console.log(dueTasks);

    let updated = 0;

    for (const { _id } of dueTasks) {
      const task = await Task.findOneAndUpdate(
        { _id, status: "Pending", end_at: { $lte: new Date() } },
        { $set: { status: "Overdue" } },
        { returnDocument: "after" },
      ).populate("user", "email");
      if (!task) continue; //skips any line of code from here
      updated++;
      //notify clients viewing tasks
      // Broadcast the updated task to connected clients
      try {
        if(io){
            await broadcastRoom(io, task.id);
        }

      } catch (error) {
        logger.error(
          `[OverdueJob] Socket broadcast failed for task ${task.id}:`,
          error,
        );
      }

      try {
        if (task.user?.email) {
          await SendOverDueEmail(task, task.user);
        } else {
          logger.warn(
            `[OverdueJob] Task ${task.id} has no user email, skipped mail`,
          );
        }
      } catch (error) {
        logger.error(
          `[OverdueJob] Could not email about task ${task.id}:`,
          error,
        );
      }
    }
    if (updated > 0) {
      logger.info(`[OverdueJob] Marked ${updated} task(s) as overdue`);
    }
  } catch (error) {
    logger.error(`[overdueJob] Failed to update overdue tasks:`, error);
  } finally {
    isRunning = false;
  }
}

function startOverdueJob(io) {
  markOverDueTasks(io);
  cron.schedule("* * * * *", () =>{
    markOverDueTasks(io);
  });
}

module.exports = {
  startOverdueJob,
  markOverDueTasks,
};
