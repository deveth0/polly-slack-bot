import { KnownBlock, ModalView } from "@slack/bolt";
import dynamodb from "../database/dynamodb";
import { ScheduleType } from "../model/Schedule";
import { renderPollScheduleModalPartial } from "./pollScheduleModalPartial";

export const POLL_SETTINGS_MODAL_CALLBACK = "pollSettingsModal";

export interface PollSettingsModalMetadata {
  channelId: string;
  pollId: string;
}

export async function renderPollSettingsModal(
  channelId: string,
  pollId: string,
  tzOffset: number,
  newScheduleType?: ScheduleType,
): Promise<ModalView> {
  const existingSchedule = await dynamodb.getSchedule(pollId);

  const blocks: KnownBlock[] = [];

  blocks.push(...renderPollScheduleModalPartial(pollId, tzOffset, existingSchedule, newScheduleType));

  return {
    title: {
      type: "plain_text",
      text: "Poll Settings",
    },
    submit: {
      type: "plain_text",
      text: "Submit",
    },
    blocks: blocks,
    type: "modal",
    callback_id: POLL_SETTINGS_MODAL_CALLBACK,
    private_metadata: JSON.stringify({ channelId, pollId } as PollSettingsModalMetadata),
  };
}
