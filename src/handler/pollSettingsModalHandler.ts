import { AllMiddlewareArgs, Logger, SlackActionMiddlewareArgs, SlackViewMiddlewareArgs, ViewOutput } from "@slack/bolt";
import { BlockAction } from "@slack/bolt/dist/types/actions/block-action";
import { isStaticSelectAction } from "../util/typechecks";
import { postError } from "../view/viewHelper";
import { PollSettingsModalMetadata, renderPollSettingsModal } from "../view/pollSettingsModal";
import { ScheduleType } from "../model/Schedule";
import { ViewStateValue, ViewSubmitAction } from "@slack/bolt/dist/types/view";
import { parse } from "@datasert/cronjs-parser";
import * as cronjsMatcher from "@datasert/cronjs-matcher";
import dynamodb from "../database/dynamodb";
import { isAllowedToEditPoll } from "../util/permissions";
import { PollOptions } from "../model/Poll";

export const POLL_SCHEDULE_TYPE_SELECT_ACTION_ID = "pollScheduleTypeSelect";
export const POLL_ADMINS_ACTION_ID = "pollAdmins";
export const POLL_ADMIN_OPTIONS_ID = "pollOptions";

/**
 * Handles the change of the Poll Schedule Type
 */
export async function handlePollScheduleTypeChange({
  ack,
  body,
  client,
  logger,
}: SlackActionMiddlewareArgs<BlockAction> & AllMiddlewareArgs) {
  await ack();

  logger.info("Handling Poll Schedule Type Change");

  const select = body.actions.find(action => action.action_id === POLL_SCHEDULE_TYPE_SELECT_ACTION_ID);
  const metaData = JSON.parse(body.view.private_metadata) as PollSettingsModalMetadata;

  const userInfo = await client.users.info({
    user: body.user.id,
    include_locale: true,
  });

  if (!isStaticSelectAction(select)) {
    logger.error("Invalid payload");
    await postError(body.channel.id, body.user.id, "Invalid payload");
    return;
  }

  try {
    const modalContent = await renderPollSettingsModal(
      metaData.channelId,
      metaData.pollId,
      userInfo.user.tz_offset,
      select.selected_option.value as ScheduleType,
    );

    logger.debug(JSON.stringify(modalContent));

    // Call views.update with the built-in client
    const result = await client.views.update({
      // Pass the view_id
      view_id: body.view.id,
      // Pass the current hash to avoid race conditions
      hash: body.view.hash,
      // View payload with updated blocks
      view: modalContent,
    });
    logger.info(result);
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Handle submit of the Poll Settings Modal
 */
export async function handlePollSettingsModalSubmit({
  ack,
  body,
  view,
  client,
  logger,
}: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
  await ack();

  logger.info("Handling Recurring Poll Modal Submit");
  logger.info(JSON.stringify(view.state.values));

  const metaData = JSON.parse(view.private_metadata) as PollSettingsModalMetadata;
  const existingPoll = await dynamodb.getPoll(metaData.pollId);
  if (existingPoll === undefined) {
    await postError(metaData.channelId, body.user.id, "Invalid poll");
    return;
  }
  if (!(await isAllowedToEditPoll(existingPoll, body.user.id, client))) {
    await postError(metaData.channelId, body.user.id, "Permission denied");
    return;
  }

  await handlePollScheduleSubmit(body, view, logger, metaData);

  const pollAdmins = extractSelectedUsers(view.state.values[POLL_ADMINS_ACTION_ID][POLL_ADMINS_ACTION_ID]);
  const selectedOptions = view.state.values[POLL_ADMIN_OPTIONS_ID][POLL_ADMIN_OPTIONS_ID].selected_options.map(
    opt => opt.value,
  );
  const pollOptions: PollOptions = {
    singleVote: selectedOptions.includes("singleVote"),
  };

  logger.info(JSON.stringify(pollOptions));

  await dynamodb.updatePoll(metaData.pollId, pollAdmins, pollOptions);
}

async function handlePollScheduleSubmit(
  body: ViewSubmitAction,
  view: ViewOutput,
  logger: Logger,
  metaData: PollSettingsModalMetadata,
) {
  // cron schedule
  if (view.state.values["weekdays"] && view.state.values["time"]) {
    const weekdays = extractSubmitValues(view.state.values["weekdays"]["recurring_weekdays_action"]);
    const time = parseInt(extractSubmitValue(view.state.values["time"]["recurring_time_action"]));

    if (weekdays === undefined || weekdays.length === 0 || time === undefined) {
      logger.error("Incomplete submit");
      await postError(metaData.channelId, body.user.id, "Invalid Modal");
      return;
    }

    const cronExpression = `* ${time} ? * ${weekdays.map(day => day.toUpperCase()).join(",")}`;

    try {
      // verify that we have a valid expression
      parse(cronExpression);

      logger.info(cronjsMatcher.getFutureMatches(cronExpression, { startAt: new Date().toISOString() }));
      logger.info(`Scheduling ${cronExpression}`);

      await dynamodb.createSchedule(metaData.channelId, metaData.pollId, cronExpression, "CRON");
    } catch (e) {
      logger.error(e);
    }
  } else {
    logger.info("Removing schedule");
    await dynamodb.deleteSchedule(metaData.pollId);
  }
}

function extractSubmitValue(value: ViewStateValue): string | undefined {
  if (!value.selected_option) return undefined;
  return value.selected_option.value;
}

function extractSubmitValues(value: ViewStateValue): string[] {
  if (!value.selected_options) return [];
  return value.selected_options.map(opt => opt.value);
}

function extractSelectedUsers(value: ViewStateValue): string[] {
  return value.selected_users ? value.selected_users : [];
}
