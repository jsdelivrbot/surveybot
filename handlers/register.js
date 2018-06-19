import _ from 'lodash';
import buildUrl from 'build-url';
import fs from 'fs';
import yaml from 'js-yaml';
import glob from 'glob';
import util from 'util';
import Promise from 'bluebird';
import uuidv4 from 'uuid/v4';

import controller from '../components/controller';
import events from '../components/events';
import log from '../components/log';


class SurveyHandler {
  constructor(user) {
    this.user = user;
    this.id = uuidv4();

    controller.on('interactive_message_callback', this.handlePrompt);
    events.once(`callback:${this.id}`, this.handleRedirect);

    controller.storage.users.save({id: this.user, ...this.getID()});
  }

  static surveyText = `We\'re trying to understand our Linkerd community better.
Would you mind answering a few quick questions?`;
  static surveyURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfm0Pm8WHH3Gxb3ctOuXI3JIYNKsT-WKp6VerG8YG0irprxvg/viewform';

  getID = (completed = false, optOut = false) => ({
    [this.surveyURL]: {
      update: new Date(),
      completed: completed,
      optOut: optOut,
    },
  });

  promptUser = (bot, message) => {
    log.info('promptUser', {
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
          text: surveyText,
          actions: [
            {
              name: 'openSurvey',
              type: 'button',
              value: 'openSurvey',
              text: 'Open Survey',
              url: buildUrl(`http://${process.env.PROJECT_DOMAIN}.glitch.me`, {
                path: `/callback/${this.id}`,
                queryParams: {
                  url: surveyURL,
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

    log.info('handlePrompt', {
      user: this.user,
    });
  };

  handleRedirect = () => {
    log.info('handleRedirect', {
      user: this.user,
      callback: this.id,
    });

    controller.storage.users.save({id: this.user, ...this.getID(true)});
  }
}

export default async () => {
  controller.hears(
    ['survey'],
    'direct_message',
    (bot, message) => new SurveyHandler(message.user).promptUser(bot, message));
}
