# Polly Bot

Serverless Poll Bot for Slack using the [Serverless Framework for deployment](https://www.serverless.com/framework).

Polly is designed to run on AWS infrastructure using [Lambda](https://aws.amazon.com/lambda/) and [DynamoDB](https://aws.amazon.com/dynamodb/). For small to medium teams the free tier provided by AWS should allow the usage without any costs.

## Usage

After installing and adding the Bot to your Channel, you can create new polls using the `/poll` command.

```
/poll "Do you like cats?" "Yes" "Of Course" "Everybody loves cats"
```

Next to the created poll you'll find a menu button which allows you to close and delete the poll. Furthermore you can open the settings menu that is used for things like scheduling.

### Scheduling

You can create reuccuring polls using the scheduling feature. Open the settings menu, select the prefered schedule type and then configure it. 

The configured time is using the user's timezone.

## Getting started

### Slack pt.1

* Go to https://api.slack.com/apps and create a new App
* Copy the "Signing Secret" to your config (see below)
* Open "OAuth & Permissions" and add the following permissions:
    - app_mentions:read
    - channels:history
    - chat:write
    - commands
    - users:read
* Click the "Install in Workspace" button and copy the "Bot Token" to your config (see below)

### Configuration & Deployment

Create an .env file with the following content:

```
CLIENT_SIGNING_SECRET=123456450645
BOT_TOKEN=xoxb-SOME_TOKEN
```

After setting up serverless, you can simply deploy the application using:

```
sls deploy
```

### Slack pt.2

When the application is deployed, you need to add the following configurations to Slack:

* Event Subscriptions
    - Add Request URL
    - Subscribe to `app_mention` and `message.channels` commands
* Slash Commands
    - Create new Command `/poll` with Request Url
* Interactivity & Shortcuts
    - Add Request URL

Now you should be able to add the Bot to your channels and use it.

## Development

There is a docker-compose file in `/dynamodb` that can be used to start a local dynamoDB.

Afterwards the Bot can be started with `npm start`. It's required to setup some reverse proxy (e.g. using `ngrok`).


# Acknowledgements

This bot was largely inspired by the [openpollslack](https://gitlab.com/openpollslack/openpollslack) build by @KazuAlex.

