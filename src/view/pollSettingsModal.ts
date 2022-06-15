import { KnownBlock, ModalView, Option } from "@slack/bolt";
import dynamodb from "../database/dynamodb";
import { ScheduleType } from "../model/Schedule";
import { renderPollScheduleModalPartial } from "./pollScheduleModalPartial";
import { POLL_ADMIN_OPTIONS_ID, POLL_ADMINS_ACTION_ID } from "../handler/pollSettingsModalHandler";
import { Poll } from "../model/Poll";

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
  const poll = await dynamodb.getPoll(pollId);

  const blocks: KnownBlock[] = [];

  blocks.push(...renderPollScheduleModalPartial(tzOffset, existingSchedule, newScheduleType));
  blocks.push(...renderPollSettingsPartial(poll));

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

function renderPollSettingsPartial(poll: Poll) {
  const blocks: KnownBlock[] = [];

  const pollOptions = [
    {
      value: "singleVote",
      text: {
        type: "plain_text",
        text: "One vote per user",
      },
    },
  ] as Option[];

  const initialOptions = [];
  if (poll.Options && poll.Options.singleVote) {
    initialOptions.push(pollOptions.find(opt => opt.value === "singleVote"));
  }

  blocks.push({
    type: "input",
    block_id: POLL_ADMIN_OPTIONS_ID,
    optional: true,
    label: {
      type: "plain_text",
      text: "Poll Options",
    },
    element: {
      action_id: POLL_ADMIN_OPTIONS_ID,
      type: "checkboxes",
      ...(initialOptions.length > 0 && {
        initial_options: initialOptions,
      }),
      options: pollOptions,
    },
  });

  blocks.push({
    type: "input",
    block_id: POLL_ADMINS_ACTION_ID,
    element: {
      action_id: POLL_ADMINS_ACTION_ID,
      type: "multi_users_select",
      placeholder: {
        type: "plain_text",
        text: "Select users",
      },
      initial_users: poll.Admins,
    },
    optional: true,
    hint: {
      type: "plain_text",
      text: "(Optional) other others allowed to edit this poll",
    },
    label: {
      type: "plain_text",
      text: "Poll Admins",
    },
  });

  return blocks;
}
