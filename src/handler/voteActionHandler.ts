import { AllMiddlewareArgs, KnownBlock, SlackActionMiddlewareArgs } from "@slack/bolt";
import { BlockAction } from "@slack/bolt/dist/types/actions/block-action";
import dynamoClient from "../database/dynamodb";
import { Vote, VoteActionValue } from "../model/Poll";
import { isButton, isContextBlock, isMrkdwnElement, isSectionBlock } from "../util/typechecks";
import { postError, updateMessage } from "../view/viewHelper";

export const VOTE_HANDLE_VOTE_ACTION_ID = "handleVoteAction";

export async function handleVote({ action, ack, body }: SlackActionMiddlewareArgs<BlockAction> & AllMiddlewareArgs) {
  await ack();

  if (
    !body ||
    !action ||
    !body.user ||
    !body.user.id ||
    !body.message ||
    !body.message.blocks ||
    !body.message.ts ||
    !body.channel ||
    !body.channel.id
  ) {
    await postError(body.channel.id, body.user.id, "Required data missing");
    return;
  }

  const user_id = body.user.id;
  const message = body.message;
  const blocks = message.blocks as KnownBlock[];

  const channel = body.channel.id;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const value = JSON.parse(action.value) as VoteActionValue;
  console.log(`Voting for ${value.pollId} (choice ${value.id}) (channel: ${channel}`);

  // verify that the poll is still open
  if (await dynamoClient.isPollClosed(value.pollId)) {
    await postError(body.channel.id, body.user.id, "You can't change your votes on closed poll.");
    return;
  } else {
    await dynamoClient.castVote(value.pollId, value.id, user_id);

    // Update the displayed message
    const votes = await dynamoClient.getVotes(value.pollId);

    const votesByChoice = votes.reduce((group, vote) => {
      const { ChoiceId } = vote;
      group[ChoiceId] = group[ChoiceId] ?? [];
      group[ChoiceId].push(vote);
      return group;
    }, {} as Record<string, Vote[]>);

    blocks.forEach((block, idx) => {
      if (isSectionBlock(block) && isButton(block.accessory) && block.accessory.value) {
        const voteOption = JSON.parse(block.accessory.value) as VoteActionValue;

        block.accessory.value = JSON.stringify(voteOption);

        const textBlock = blocks[idx + 1];
        // update the displayed text
        if (isContextBlock(textBlock) && isMrkdwnElement(textBlock.elements[0])) {
          const votesForGroup = votesByChoice[voteOption.id] || [];
          let newVotes: string;
          if (votesForGroup.length === 0) {
            newVotes = "No votes";
          } else {
            const voteMentions = votesForGroup.map(vote => `<@${vote.UserId}>`).join(" ");
            newVotes = `${votesForGroup.length} vote${votesForGroup.length === 1 ? "" : "s"}: ${voteMentions}`;
          }

          textBlock.elements[0].text = newVotes;
        }
      }
    });

    await updateMessage(channel, message.ts, blocks);
  }
}
