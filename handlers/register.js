import _ from 'lodash';
import buildUrl from 'build-url';
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
    (bot, message) => new CommunitySurvey(message.user).prompt(bot, message));

  constructor(user) {
    super(user);

    controller.on('interactive_message_callback', this.handlePrompt);
    events.once(`callback:${this.id}`, this.handleRedirect);

    controller.storage.users.save({id: this.user, ...this.getID()});
  }

  surveyText = `We're trying to understand our Linkerd community better.
Would you mind answering a few quick questions?`;
  surveyURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfm0Pm8WHH3Gxb3ctOuXI3JIYNKsT-WKp6VerG8YG0irprxvg/viewform';

  getID = (completed = false, optOut = false) => ({
    [this.name]: {
      update: new Date(),
      completed: completed,
      optOut: optOut,
    },
  });

  prompt = (bot, message) => {
    log.info({
      fn: 'promptUser',
      user: this.user,
      callback: this.id,
    });

    bot.say({
      channel: message.user,
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

  handlePrompt = (bot, message) => {
    if (message.callback_id !== this.id) return;

    log.info({
      fn: 'handlePrompt',
      user: this.user,
      callback: this.id,
    });
  };

  handleRedirect = () => {
    log.info({
      fn: 'handleRedirect',
      user: this.user,
      callback: this.id,
    });

    controller.storage.users.save({id: this.user, ...this.getID(true)});
  }
}

export const messages = [
  CommunitySurvey,
];

export default async () => _.each(messages, msg => msg.register());
