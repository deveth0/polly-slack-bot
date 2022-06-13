import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

import dynamoClient from "../database/dynamodb";
import { Schedule } from "../model/Schedule";
import * as cronjsMatcher from "@datasert/cronjs-matcher";
import { createPoll } from "../handler/pollCommandHandler";

class Scheduler {
  private static scheduleMatches(schedule: Schedule): boolean {
    try {
      const now = new Date();
      now.setSeconds(0);
      now.setMilliseconds(0);

      console.log(`now: ${now.toISOString()}`);
      console.log(cronjsMatcher.getFutureMatches(schedule.CronExp, { startAt: now.toISOString() }));

      return cronjsMatcher.isTimeMatches(schedule.CronExp, now.toISOString());
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  private static async handleCronSchedule(schedule: Schedule) {
    // check if schedule matches
    if (Scheduler.scheduleMatches(schedule)) {
      console.log("Schedule matches");
      const poll = await dynamoClient.getPoll(schedule.id);
      if (poll === undefined) {
        console.log("Poll does not exist. deleting schedule");
        await dynamoClient.deleteSchedule(schedule.id);
      } else {
        console.log("Recreating Poll");
        await createPoll(
          schedule.ChannelId,
          poll.UserId,
          `${poll.Question} (:repeat: recurring poll)`,
          poll.Choices,
          poll.id,
        );
      }
    } else {
      console.log("Schedule does not match");
    }
  }

  private static async handleSchedule(schedule: Schedule) {
    switch (schedule.Type) {
      case "CRON":
        await this.handleCronSchedule(schedule);
        break;
      case "NONE":
      case "OTHER":
      default:
        console.log("Unsupported Type");
    }
  }

  public async handle() {
    // get all schedules
    const schedules = await dynamoClient.getSchedules();

    console.log(`Found ${schedules.length} schedules`);

    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      await Scheduler.handleSchedule(schedule);
    }
  }
}

export const scheduler = new Scheduler();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler: APIGatewayProxyHandler = async (event, context) => {
  return scheduler
    .handle()
    .then(() => {
      return {
        statusCode: 200,
        body: "Success",
      } as APIGatewayProxyResult;
    })
    .catch(e => {
      console.log(JSON.stringify(e));
      return {
        statusCode: 500,
        body: JSON.stringify(e),
      } as APIGatewayProxyResult;
    });
};
