import { AllMiddlewareArgs, SlackActionMiddlewareArgs } from "@slack/bolt";
import { BlockAction } from "@slack/bolt/dist/types/actions/block-action";
import dynamodb from "../database/dynamodb";
import { postError } from "../view/viewHelper";
import { isAllowedToEditPoll } from "../util/permissions";

export interface DeleteScheduleActionValue {
  pollId: string;
}

export const POLL_DELETE_SCHEDULE_ACTION_ID = "delete_schedule";

export async function handleDeleteSchedule({
  ack,
  action,
  body,
  client,
  logger,
}: SlackActionMiddlewareArgs<BlockAction> & AllMiddlewareArgs) {
  await ack();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const value = JSON.parse(action.value) as DeleteScheduleActionValue;

  logger.info("Deleting schedule for poll " + value.pollId);

  const poll = await dynamodb.getPoll(value.pollId);

  if (!(await isAllowedToEditPoll(poll, body.user.id, client))) {
    await postError(body.channel.id, body.user.id, "You can't delete poll schedule from another user.");
    return;
  }

  await dynamodb.deleteSchedule(value.pollId);
}
