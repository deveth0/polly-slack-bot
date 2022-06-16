import { App, AwsLambdaReceiver, LogLevel } from "@slack/bolt";
import { AwsCallback, AwsEvent } from "@slack/bolt/dist/receivers/AwsLambdaReceiver";
import dynamoClient, { DynamoClient } from "./database/dynamodb";
import { handlePollCommand } from "./handler/pollCommandHandler";
import { handleVote, VOTE_HANDLE_VOTE_ACTION_ID, VOTE_HANDLE_VOTE_LEGACY_ID } from "./handler/voteActionHandler";
import { handlePollOptionMenuAction, POLL_OPTIONS_MENU_ACTION_ID } from "./handler/pollOptionsMenuButtonHandler";
import { handleDeleteSchedule, POLL_DELETE_SCHEDULE_ACTION_ID } from "./handler/deleteScheduleHandler";
import { POLL_SETTINGS_MODAL_CALLBACK } from "./view/pollSettingsModal";
import {
  handlePollScheduleTypeChange,
  handlePollSettingsModalSubmit,
  POLL_SCHEDULE_TYPE_SELECT_ACTION_ID,
} from "./handler/pollSettingsModalHandler";

class PollyBot {
  public awsLambdaReceiver: AwsLambdaReceiver;
  public app: App;
  private dynamoDB: DynamoClient;

  constructor() {
    this.awsLambdaReceiver = new AwsLambdaReceiver({
      signingSecret: process.env.CLIENT_SIGNING_SECRET,
    });
    this.dynamoDB = dynamoClient;
    this.app = new App({
      token: process.env.BOT_TOKEN,
      receiver: this.awsLambdaReceiver,
      logLevel: LogLevel.DEBUG,
    });

    this.setUp();
  }

  private setUp() {
    this.app.command("/poll", handlePollCommand);

    this.app.action(VOTE_HANDLE_VOTE_ACTION_ID, handleVote);
    this.app.action(VOTE_HANDLE_VOTE_LEGACY_ID, handleVote);

    this.app.action(POLL_SCHEDULE_TYPE_SELECT_ACTION_ID, handlePollScheduleTypeChange);

    this.app.action(POLL_OPTIONS_MENU_ACTION_ID, handlePollOptionMenuAction);

    // schedule stuff
    this.app.view(POLL_SETTINGS_MODAL_CALLBACK, handlePollSettingsModalSubmit);

    this.app.action(POLL_DELETE_SCHEDULE_ACTION_ID, handleDeleteSchedule);
  }
}

export const pollyApp = new PollyBot();

// Handle the Lambda function event
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
module.exports.handler = async (event: AwsEvent, context: unknown, callback: AwsCallback) => {
  const handler = await pollyApp.awsLambdaReceiver.start();
  return handler(event, context, callback);
};
