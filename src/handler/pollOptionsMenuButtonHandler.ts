import { AllMiddlewareArgs, Context, KnownBlock, SlackActionMiddlewareArgs } from "@slack/bolt";
import { BlockAction } from "@slack/bolt/dist/types/actions/block-action";
import { isButton, isMrkdwnElement, isOverflow, isSectionBlock, isStaticSelect } from "../util/typechecks";
import dynamodb from "../database/dynamodb";
import { MenuItemValue } from "../model/ActionButton";
import { deleteMessage, openModal, postError, updateMessage } from "../view/viewHelper";
import WebClient from "@slack/web-api/dist/WebClient";
import { renderPollSettingsModal } from "../view/pollSettingsModal";

export const POLL_OPTIONS_MENU_ACTION_ID = "poll_option_menu";

export async function handlePollOptionMenuAction({
  ack,
  action,
  logger,
  body,
  client,
  context,
}: SlackActionMiddlewareArgs<BlockAction> & AllMiddlewareArgs) {
  await ack();

  logger.info("handlePollOptionMenuAction");

  if (isOverflow(action)) {
    const value = JSON.parse(action.selected_option.value) as MenuItemValue;

    if (value.action === "btn_delete") return deletePoll(body, context, value);
    if (value.action === "btn_close") return closePoll(body, context, value);
    if (value.action === "btn_settings") return showSchedulePollModal(body, client, context, value);
  }
}

async function showSchedulePollModal(body: BlockAction, client: WebClient, context: Context, value: MenuItemValue) {
  if (body.user.id !== value.user) {
    await postError(body.channel.id, body.user.id, "You can't schedule poll from another user.");
    return;
  }

  const userInfo = await client.users.info({
    user: body.user.id,
    include_locale: true,
  });

  await openModal(
    body.trigger_id,
    await renderPollSettingsModal(body.channel.id, value.pollId, userInfo.user.tz_offset),
  );
}

async function closePoll(body: BlockAction, context: Context, value: MenuItemValue) {
  if (
    !body ||
    !body.user ||
    !body.user.id ||
    !body.message ||
    !body.message.ts ||
    !body.channel ||
    !body.channel.id ||
    !value
  ) {
    await postError(body.channel.id, body.user.id, "Required data missing");
    return;
  }

  if (body.user.id !== value.user) {
    await postError(body.channel.id, body.user.id, "You can't close poll from another user.");
    return;
  }

  await dynamodb.closePoll(value.pollId);

  // remove Vote Buttons
  const blocks = body.message.blocks as KnownBlock[];

  blocks.forEach(block => {
    if (isSectionBlock(block) && isButton(block.accessory)) {
      delete block.accessory;
    }
  });
  // TODO: remove only menu items that are no longer needed
  if (isSectionBlock(blocks[0]) && isStaticSelect(blocks[0].accessory)) {
    //const staticSelect = blocks[0].accessory;
    const questionBlock = blocks[0];
    if (isMrkdwnElement(questionBlock.text)) {
      //TODO: markdownify
      questionBlock.text.text += " :lock: (closed)";
    } else {
      questionBlock.text.text += " :lock: (closed)";
    }
    delete blocks[0].accessory;
  }

  await updateMessage(body.channel.id, body.message.ts, blocks);
}

async function deletePoll(body: BlockAction, context: Context, value: MenuItemValue) {
  if (
    !body ||
    !body.user ||
    !body.user.id ||
    !body.message ||
    !body.message.ts ||
    !body.channel ||
    !body.channel.id ||
    !value
  ) {
    await postError(body.channel.id, body.user.id, "Required data missing");
    return;
  }

  if (body.user.id !== value.user) {
    await postError(body.channel.id, body.user.id, "You can't delete poll from another user.");
    return;
  }

  await dynamodb.deletePoll(value.pollId);

  await deleteMessage(body.channel.id, body.message.ts);
}
