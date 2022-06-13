import { KnownBlock } from "@slack/bolt";

export function createHelpView(): KnownBlock[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Open source poll for slack*",
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Simple poll*",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: '```\n/poll "What\'s your favourite color ?" "Red" "Green" "Blue" "Yellow"\n```',
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Anonymous poll (NOT IMPLEMENTED YET)*",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: '```\n/poll anonymous "What\'s your favourite color ?" "Red" "Green" "Blue" "Yellow"\n```',
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Hidden poll votes (NOT IMPLEMENTED YET)*",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: '```\n/poll hidden "What\'s your favourite color ?" "Red" "Green" "Blue" "Yellow"\n```',
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Limited choice poll (NOT IMPLEMENTED YET)*",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: '```\n/poll limit 2 "What\'s your favourite color ?" "Red" "Green" "Blue" "Yellow"\n```',
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Anonymous limited choice poll (NOT IMPLEMENTED YET)*",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: '```\n/poll anonymous limit 2 "What\'s your favourite color ?" "Red" "Green" "Blue" "Yellow"\n```',
      },
    },
  ];
}
