import _ from 'lodash';
import fs from 'fs';
import yaml from 'js-yaml';
import glob from 'glob';
import util from 'util';
import Promise from 'bluebird';
import uuidv4 from 'uuid/v4';

import controller from '../components/controller';

const surveyText = `We\'re trying to understand our Linkerd community better.
Would you mind answering a few quick questions?`;
const surveyURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfm0Pm8WHH3Gxb3ctOuXI3JIYNKsT-WKp6VerG8YG0irprxvg/viewform';

class SurveyHandler {
  constructor() {
    this.id = uuidv4();

    controller.on('interactive_message_callback', this.handleShowDialog);
    controller.on('dialog_submission', this.handleSubmission);
  }

  promptUser = (bot, message) => bot.say({
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
            url: surveyURL,
          },
          {
            name: 'cancel',
            type: 'button',
            value: 'cancel',
            text: 'Cancel',
          }
        ],
      },
    ],
  });

  handleShowDialog = (bot, message) => {
    if (message.callback_id !== this.id) return;

    console.log(message);
  };
}

export default async () => {
  controller.hears(
    ['survey'],
    'direct_message',
    (bot, message) => new SurveyHandler().promptUser(bot, message));
}
