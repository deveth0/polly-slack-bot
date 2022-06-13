import AWS from "aws-sdk"; // eslint-disable-line import/no-extraneous-dependencies
import { v4 as uuidv4 } from "uuid";
import { Poll, Vote } from "../model/Poll";
import { Schedule, ScheduleType } from "../model/Schedule";
import logger from "../util/logger";

export class DynamoClient {
  private documentClient: AWS.DynamoDB.DocumentClient;

  constructor() {
    let options = {};

    // connect to local DB if running offline
    if (process.env.IS_OFFLINE) {
      options = {
        region: "localhost",
        endpoint: "http://localhost:8000",
        accessKeyId: "DEFAULT_ACCESS_KEY", // needed if you don't have aws credentials at all in env
        secretAccessKey: "DEFAULT_SECRET", // needed if you don't have aws credentials at all in env
      };
    }

    this.documentClient = new AWS.DynamoDB.DocumentClient(options);
  }

  /**
   * Create new poll with the given config
   * @param userId
   * @param question
   * @param choices
   * @param parentId
   */
  public async createPoll(
    userId: string,
    question: string,
    choices: string[],
    parentId?: string,
  ): Promise<Poll | undefined> {
    const uuid = uuidv4();

    const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        id: uuid,
        UserId: userId,
        Question: question,
        Choices: choices,
        Closed: false,
        ParentId: parentId,
      },
    };

    try {
      return this.documentClient
        .put(params)
        .promise()
        .then(() => {
          return {
            id: uuid,
            UserId: userId,
            Question: question,
            Choices: choices,
            Closed: false,
            ParentId: parentId,
          } as Poll;
        });
    } catch (e) {
      logger.log(e);
      return undefined;
    }
  }

  public async createSchedule(channelId: string, pollId: string, cronExp: string, type: ScheduleType) {
    const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: process.env.DYNAMODB_TABLE + "-schedules",
      Item: {
        id: pollId,
        ChannelId: channelId,
        CronExp: cronExp,
        Type: type,
      } as Schedule,
    };

    try {
      return this.documentClient.put(params).promise();
    } catch (e) {
      logger.log(e);
      return undefined;
    }
  }

  public async getPoll(pollId: string): Promise<Poll | undefined> {
    const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        id: pollId,
      },
    };
    return this.documentClient
      .get(params)
      .promise()
      .then(value => value.Item as Poll);
  }

  public async getVotes(pollId: string): Promise<Vote[]> {
    const params: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: process.env.DYNAMODB_TABLE + "-votes",
      IndexName: "PollIdIndex",
      ExpressionAttributeValues: {
        ":p": pollId,
      },
      KeyConditionExpression: "PollId = :p",
    };

    return this.documentClient
      .query(params)
      .promise()
      .then(value => value.Items.map(it => it as Vote));
  }

  public async closePoll(pollId: string) {
    const params: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        id: pollId,
      },
      UpdateExpression: "set Closed = :c",
      ExpressionAttributeValues: {
        ":c": true,
      },
    };

    return this.documentClient.update(params).promise();
  }

  public async deletePoll(pollId: string) {
    /*const deleteVotesParams: AWS.DynamoDB.DocumentClient.DeleteItemInput = {
                                                                                                  TableName: process.env.DYNAMODB_TABLE + "-votes",
                                                                                                  Key: {
                                                                                                    PollId: pollId,
                                                                                                  },
                                                                                                };*/
    const deletePollParams: AWS.DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        id: pollId,
      },
    };

    return Promise.all([
      this.documentClient.delete(deletePollParams).promise(),
      //this.documentClient.delete(deleteVotesParams).promise(),
    ]);
  }

  public async deleteSchedule(scheduleId: string) {
    const params: AWS.DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: process.env.DYNAMODB_TABLE + "-schedules",
      Key: {
        id: scheduleId,
      },
    };
    return this.documentClient.delete(params).promise();
  }

  public async isPollClosed(pollId: string): Promise<boolean> {
    return this.getPoll(pollId).then(value => {
      logger.log(value);
      return value !== undefined && value.Closed;
    });
  }

  /**
   * Cast a vote for the given pollId and choiceId. if the user has already voted for the given choice, the vote is withdrawn
   * @param pollId
   * @param choiceId
   * @param userId
   */
  public async castVote(pollId: string, choiceId: string, userId: string) {
    const votes = await this.getVotes(pollId);
    // check if the user has already voted for the choice
    const vote = votes.find(vote => vote.PollId === pollId && vote.ChoiceId === choiceId && vote.UserId === userId);
    if (vote !== undefined) {
      const params: AWS.DynamoDB.DocumentClient.DeleteItemInput = {
        TableName: process.env.DYNAMODB_TABLE + "-votes",
        Key: {
          id: vote.id,
        },
      };
      return this.documentClient.delete(params).promise();
    } else {
      const uuid = uuidv4();

      const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
        TableName: process.env.DYNAMODB_TABLE + "-votes",
        Item: {
          id: uuid,
          PollId: pollId,
          ChoiceId: choiceId,
          UserId: userId,
        },
      };

      return this.documentClient.put(params).promise();
    }
  }

  public async getSchedules() {
    const params: AWS.DynamoDB.DocumentClient.ScanInput = {
      TableName: process.env.DYNAMODB_TABLE + "-schedules",
    };
    return this.documentClient
      .scan(params)
      .promise()
      .then(value => value.Items.map(item => item as Schedule));
  }

  public async getSchedule(pollId: string) {
    const params: AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: process.env.DYNAMODB_TABLE + "-schedules",
      Key: {
        id: pollId,
      },
    };
    return this.documentClient
      .get(params)
      .promise()
      .then(value => value.Item as Schedule);
  }
}

const dynamoClient = new DynamoClient();

export default dynamoClient;
