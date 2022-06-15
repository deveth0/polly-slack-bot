import { Poll } from "../model/Poll";
import WebClient from "@slack/web-api/dist/WebClient";

/**
 * Verify if the given user is allowed to edit the poll
 *
 */
export async function isAllowedToEditPoll(poll: Poll, userId: string, webClient: WebClient): Promise<boolean> {
  if (userId === poll.UserId) return true;
  if (poll.Admins !== undefined && poll.Admins.includes(poll.UserId)) return true;

  // fallback to workspace admins
  const userInfo = await webClient.users.info({
    user: userId,
  });

  if (userInfo.user && userInfo.user.is_admin) return true;
  return false;
}
