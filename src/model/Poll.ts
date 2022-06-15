/**
 * Interface for a Poll in Database
 */
export interface Poll {
  id: string;
  UserId: string;
  Question: string;
  Choices: string[];
  Closed: boolean;
  // optional ID of the parent poll (used for scheduled polls)
  ParentId: string | undefined;
  // list of other poll admins allowed to edit the poll
  Admins: string[];
  Options: PollOptions;
}

export interface PollOptions {
  singleVote: boolean;
}

export interface Vote {
  id: string;
  PollId: string;
  ChoiceId: string;
  UserId: string;
}

/**
 * Value attached to a vote action
 */
export interface VoteActionValue {
  pollId: string;
  voters: string[];
  id: string;
}
