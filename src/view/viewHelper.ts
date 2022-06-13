import { Block, KnownBlock, View } from "@slack/bolt";
import { pollyApp } from "../app";

export async function postMessage(channelId: string, text: string, blocks: (Block | KnownBlock)[]) {
  return await pollyApp.app.client.chat.postMessage({
    channel: channelId,
    blocks: blocks,
    text: text,
  });
}

export async function updateMessage(channelId: string, ts: string, blocks: (Block | KnownBlock)[]) {
  return await pollyApp.app.client.chat.update({
    channel: channelId,
    ts: ts,
    blocks: blocks,
  });
}

export async function deleteMessage(channelId: string, ts: string) {
  await pollyApp.app.client.chat.delete({
    channel: channelId,
    ts: ts,
  });
}

export async function postEphemeral(channelId: string, userId: string, blocks: (Block | KnownBlock)[]) {
  return pollyApp.app.client.chat.postEphemeral({
    channel: channelId,
    user: userId,
    blocks: blocks,
  });
}

export async function postError(channelId: string, userId: string, text: string) {
  return pollyApp.app.client.chat.postEphemeral({
    channel: channelId,
    user: userId,
    attachments: [],
    text: text,
  });
}

export async function openModal(trigger_id: string, view: View) {
  return pollyApp.app.client.views.open({
    trigger_id: trigger_id,
    view: view,
  });
}
