import { AllMiddlewareArgs, SlackActionMiddlewareArgs, SlackViewMiddlewareArgs } from "@slack/bolt";
import { BlockAction } from "@slack/bolt/dist/types/actions/block-action";
import { isStaticSelectAction } from "../util/typechecks";
import { postError } from "../view/viewHelper";
import { PollSettingsModalMetadata, renderPollSettingsModal } from "../view/pollSettingsModal";
import { ScheduleType } from "../model/Schedule";
import { ViewStateValue, ViewSubmitAction } from "@slack/bolt/dist/types/view";
import { parse } from "@datasert/cronjs-parser";
import * as cronjsMatcher from "@datasert/cronjs-matcher";
import dynamodb from "../database/dynamodb";

export const POLL_SCHEDULE_TYPE_SELECT_ACTION_ID = "pollScheduleTypeSelect";

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

export async function handlePollSettingsSubmit({
  ack,
  body,
  view,
  logger,
}: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
  await ack();

  logger.info("Handling Recurring Poll Modal Submit");

  logger.info(JSON.stringify(view.state.values));
  const metaData = JSON.parse(view.private_metadata) as PollSettingsModalMetadata;

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
