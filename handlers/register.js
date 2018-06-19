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

class CommunitySurvey extends UserMessage {
  static register = () => controller.hears(
    ['survey'],
    'direct_message',
    async (bot, message) => {
      const msg = new CommunitySurvey(message.team_id, message.user);

      await msg.updateUser();
      msg.prompt(bot);
    });

  constructor(team, user) {
    super(team, user);

    controller.on('interactive_message_callback', this.handlePrompt);
    events.once(`callback:${this.id}`, this.handleRedirect);
  }

  maxPings = 3;
  interval = {seconds: 5};
  surveyText = `We're trying to understand our Linkerd community better.
Would you mind answering a few quick questions?`;
  surveyURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfm0Pm8WHH3Gxb3ctOuXI3JIYNKsT-WKp6VerG8YG0irprxvg/viewform';

  // XXX: This should be a util function.
//  updateUser = (completed = false, optOut = false, count = 0) => util.promisify(
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
          count: 0,
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

  prompt = bot => {
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
        text: 'Open Survey',
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
        text: 'Cancel',
      }
    ];

    bot.say({
      channel: this.user,
      attachments: [
        {
          title: 'Hi from your friends at Buoyant!',
          fallback: 'Hi from your friends at Buoyant!',
          color: 'good',
          attachment_type: 'default',
          callback_id: this.id,
          text: this.surveyText,
          actions: actions,
        },
      ],
    });
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

    const team = await util.promisify(controller.storage.teams.get)(this.team);
    const bot = controller.spawn(team.bot);

    this.prompt(bot);
  }

  handlePrompt = async (bot, message) => {
    if (message.callback_id !== this.id) return;

    log.info({
      fn: 'handlePrompt',
      user: this.user,
      callback: this.id,
    });

    await this.updateUser({optOut: true});
  };

  handleRedirect = async () => {
    log.info({
      fn: 'handleRedirect',
      user: this.user,
      callback: this.id,
    });

    await this.updateUser({complete: true});
  }
}

export const messages = [
  CommunitySurvey,
];

export default async () => _.each(messages, msg => msg.register());
