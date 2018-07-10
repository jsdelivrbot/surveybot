import _ from 'lodash';
import { DateTime } from 'luxon';
import buildUrl from 'build-url';
import util from 'util';
import uuidv4 from 'uuid/v4';

import controller from '../components/controller';
import events from '../components/events';
import log from '../components/log';

class UserMessage {
  constructor(team, user) {
    this.team = team;
    this.user = user;
    this.id = uuidv4();
  }
}

// member_joined_channel
// team_join

class CommunitySurvey extends UserMessage {
  static register = () => {
    const sendMessage = async (bot, message) => {
      const msg = new CommunitySurvey(message.team_id, message.user);

      await msg.updateUser();
      msg.prompt(bot);
    }

    controller.hears(['survey'], 'direct_message', sendMessage);
    controller.on('member_joined_channel', (bot, message) => {
      // #linkerd (the default channel, so this triggers on team_join basically)
      if (message.channel != 'C0JV5E7BR') return;

      log.info(message.event, 'sending survey');
      sendMessage(bot, message);
    });
  }

  constructor(team, user) {
    super(team, user);

    controller.on('interactive_message_callback', this.handlePrompt);
  }

  maxPings = 3;
  interval = {days: 3};
  surveyText = `Please help us build the Linkerd features that matter most by answering our community survey!`;
  surveyURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfm0Pm8WHH3Gxb3ctOuXI3JIYNKsT-WKp6VerG8YG0irprxvg/viewform';

  successMessage = `Thank you for completing the survey!
Please also subscribe to the [linkerd-users mailing list](https://groups.google.com/forum/#!forum/linkerd-users) for longer-form questions!
You can also try the [Linkerd discourse forums](https://discourse.linkerd.io/c/help) for more.`;

  // XXX: This should be a util function.
  updateUser = async (opts, remove = false) => {
    let user = {};
    try {
      user = await util.promisify(controller.storage.users.get)(this.user);
    } catch(err) {
      // ignored
    } finally {
      let data = {
        [CommunitySurvey.name]: _.merge({
          update: DateTime.utc(),
          completed: false,
          optOut: false,
          count: 1,
        }, opts),
      };

      if (remove) {
        delete user[CommunitySurvey.name];
        data = {};
      }

      await util.promisify(controller.storage.users.save)(_.merge(user, {
        id: this.user,
        team: this.team,
        ...data,
      }));
    }
  }

  // XXX: This should be a util function.
  getBot = async () => controller.spawn(
    (await util.promisify(controller.storage.teams.get)(this.team)).bot);

  prompt = async bot => {
    log.info({
      fn: 'promptUser',
      user: this.user,
      callback: this.id,
    });

    const actions = [
      {
        name: 'openSurvey',
        type: 'button',
        value: 'openSurvey',
        text: 'Community Survey',
        url: buildUrl(`http://${process.env.PROJECT_DOMAIN}.glitch.me`, {
          path: `/callback/${this.id}`,
          queryParams: {
            url: this.surveyURL,
          },
        }),
      },
      {
        name: 'cancel',
        type: 'button',
        value: 'cancel',
        text: 'Don\'t ask me again',
      }
    ];

    const original = await util.promisify(bot.say)({
      channel: this.user,
      attachments: [
        {
          title: 'Hi from your friendly local Linkerd maintainers!',
          fallback: 'Hi from your friendly local Linkerd maintainers!',
          color: 'good',
          attachment_type: 'default',
          callback_id: this.id,
          text: this.surveyText,
          actions: actions,
        },
      ],
    });

    events.once(`callback:${this.id}`, _.partial(this.handleRedirect, original));
  }

  nag = async (state) => {
    const {completed, optOut, count, update} = state;

    const logTags = {
      fn: 'nag',
      user: this.user,
      ...state,
    };
    log.info(logTags, 'checking');

    if (completed || optOut || count >= this.maxPings) {
      log.info(logTags, 'do not nag');
      await this.updateUser({}, true);

      return;
    }

    if (DateTime.fromISO(update).plus(this.interval) > DateTime.utc()) {
      log.info(logTags, 'too soon');
      return;
    }

    log.info(logTags, 'send nag');

    await this.updateUser({count: count+1});

    this.prompt(await this.getBot());
  }

  handlePrompt = async (bot, message) => {
    if (message.callback_id !== this.id) return;

    log.info({
      fn: 'handlePrompt',
      user: this.user,
      callback: this.id,
    });

    bot.replyInteractive(message, {
      text: `We won't bother you about this again.`,
    });

    await this.updateUser({optOut: true});
  };

  handleRedirect = async original => {
    log.info({
      fn: 'handleRedirect',
      user: this.user,
      callback: this.id,
    });

    const bot = await this.getBot();
    await util.promisify(bot.api.chat.update)({
      text: this.successMessage,
      ts: original.ts,
      channel: original.channel,
      attachments: [],
    });

    await this.updateUser({completed: true});
  }
}

export const messages = [
  CommunitySurvey,
];

export default async () => _.each(messages, msg => msg.register());
