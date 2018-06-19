import _ from 'lodash';
import { DateTime } from 'luxon';
import buildUrl from 'build-url';
import util from 'util';
import uuidv4 from 'uuid/v4';

import controller from '../components/controller';
import events from '../components/events';
import log from '../components/log';

class UserMessage {
  // static register = () => {};

  constructor(user) {
    this.user = user;
    this.id = uuidv4();
  }

  // prompt = (bot, message) => {};

  // nag = () => false;
}

class CommunitySurvey extends UserMessage {
  static register = () => controller.hears(
    ['survey'],
    'direct_message',
    (bot, message) => new CommunitySurvey(message.user).prompt(bot));

  constructor(user) {
    super(user);

    controller.on('interactive_message_callback', this.handlePrompt);
    events.once(`callback:${this.id}`, this.handleRedirect);

    this.updateUser();
  }

  maxPings = 3;
  interval = {seconds: 1};
  surveyText = `We're trying to understand our Linkerd community better.
Would you mind answering a few quick questions?`;
  surveyURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfm0Pm8WHH3Gxb3ctOuXI3JIYNKsT-WKp6VerG8YG0irprxvg/viewform';

  updateUser = (completed = false, optOut = false, count = 0) => util.promisify(
    controller.storage.users.save)({
      id: this.user,
      [CommunitySurvey.name]: {
        update: new Date(),
        completed: completed,
        optOut: optOut,
        count: count,
      },
    });

  prompt = bot => {
    console.log(bot);
    log.info({
      fn: 'promptUser',
      user: this.user,
      callback: this.id,
    });

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
          actions: [
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
            },
          ],
        },
      ],
    });
  }

  nag = ({completed, update, optOut, count}) => {
    log.info({
      fn: 'nag',
      user: this.user
    });

    if (completed || optOut || count >= this.maxPings) return;

    if (DateTime.fromISO(update).plus(this.interval) < DateTime.utc()) return;

    this.updateUser(completed, optOut, count+1);

    this.prompt()
  }

  handlePrompt = (bot, message) => {
    if (message.callback_id !== this.id) return;

    log.info({
      fn: 'handlePrompt',
      user: this.user,
      callback: this.id,
    });

    this.updateUser(false, true);
  };

  handleRedirect = () => {
    log.info({
      fn: 'handleRedirect',
      user: this.user,
      callback: this.id,
    });

    this.updateUser(true);
  }
}

export const messages = [
  CommunitySurvey,
];

export default async () => _.each(messages, msg => msg.register());
