import { AllMiddlewareArgs, Context, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { createHelpView } from "../view/helpView";
import { postEphemeral, postError, postMessage } from "../view/viewHelper";
import dynamoClient from "../database/dynamodb";
import { createPollView } from "../view/pollView";

/**
 * Create poll with the given properties
 */
export async function createPoll(
  channelId: string,
  userId: string,
  question: string,
  options: string[],
  parentId?: string,
) {
  const poll = await dynamoClient.createPoll(userId, question, options, parentId);

  if (poll === undefined || poll.id === undefined) {
    console.error("Failed to create Poll");

    await postError(channelId, userId, "You can't change your votes on closed poll.");

    return;
  }

  const blocks = createPollView(poll);

  if (null === blocks) {
    return;
  }

  await postMessage(channelId, `Poll : ${question}`, blocks);
}

/**
 * Handler for the /poll command
 */
export async function handlePollCommand({ ack, command, context }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
  await ack();

  if (!command || !command.text || !command.channel_id || !command.user_id) {
    return;
  }

  const cmdBody = command.text.trim();
  const isHelp = cmdBody === "help";
  const channelId = command.channel_id;
  const userId = command.user_id;

  if (isHelp) {
    return showHelpView(context, channelId, userId);
  } else {
    return createPollFromCommand(channelId, userId, cmdBody);
  }
}

async function createPollFromCommand(channelId: string, userId: string, cmdBody: string) {
  let question = null;
  const options = [];

  const lastSep = cmdBody.split("").pop();
  const firstSep = cmdBody.charAt(0);

  const regexp = new RegExp(firstSep + "[^" + firstSep + "\\\\]*(?:\\\\[Ss][^" + lastSep + "\\\\]*)*" + lastSep, "g");
  for (const option of cmdBody.match(regexp)) {
    const opt = option.substring(1, option.length - 1);
    if (question === null) {
      question = opt;
    } else {
      options.push(opt);
    }
  }

  return createPoll(channelId, userId, question, options);
}

async function showHelpView(context: Context, channelId: string, userId: string) {
  const blocks = createHelpView();

  await postEphemeral(channelId, userId, blocks);
}
