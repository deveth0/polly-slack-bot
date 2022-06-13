import { POLL_OPTIONS_MENU_ACTION_ID } from "../handler/pollOptionsMenuButtonHandler";
import { Poll, VoteActionValue } from "../model/Poll";
import { Block } from "@slack/bolt";
import { VOTE_HANDLE_VOTE_ACTION_ID } from "../handler/voteActionHandler";

export function createPollView({
  id: pollId,
  Question: question,
  Choices: options,
  UserId: userId,
  ParentId: parentId,
}: Poll): Block[] | null {
  if (!pollId || !question || !options || 0 === options.length) {
    return null;
  }

  const blocks = [];

  const menuItems = [
    {
      text: {
        type: "plain_text",
        text: "Delete the poll",
      },
      value: JSON.stringify({ action: "btn_delete", user: userId, pollId: pollId }),
    },
    {
      text: {
        type: "plain_text",
        text: "Close the poll",
      },
      value: JSON.stringify({ action: "btn_close", user: userId, pollId: pollId }),
    },
  ];

  if (parentId === undefined) {
    menuItems.push({
      text: {
        type: "plain_text",
        text: "Settings",
      },
      value: JSON.stringify({ action: "btn_settings", user: userId, pollId: pollId }),
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: question,
    },
    accessory: {
      type: "overflow",
      action_id: POLL_OPTIONS_MENU_ACTION_ID,
      options: menuItems,
    },
  });

  const elements = [];

  elements.push({
    type: "mrkdwn",
    text: "created by <@" + userId + ">",
  });
  blocks.push({
    type: "context",
    elements: elements,
  });
  blocks.push({
    type: "divider",
  });

  const button_value: VoteActionValue = {
    pollId: pollId,
    voters: [],
    id: null,
  };

  options.forEach((option, idx) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const btn_value = JSON.parse(JSON.stringify(button_value));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    btn_value.id = idx;
    let block = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: option,
      },
      accessory: {
        type: "button",
        action_id: VOTE_HANDLE_VOTE_ACTION_ID,
        text: {
          type: "plain_text",
          emoji: true,
          text: "Vote",
        },
        value: JSON.stringify(btn_value),
      },
    };
    blocks.push(block);
    block = {
      type: "context",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      elements: [
        {
          type: "mrkdwn",
          text: "No votes",
        },
      ],
    };
    blocks.push(block);
    blocks.push({
      type: "divider",
    });
  });

  return blocks;
}
