import _ from 'lodash';
import fs from 'fs';
import yaml from 'js-yaml';
import glob from 'glob';
import util from 'util';
import Promise from 'bluebird';
import uuidv4 from 'uuid/v4';

// const getConfigs = async () => {
//   return await Promise.map(
//     await util.promisify(glob)(`${__dirname}/*.yaml`),
//     async fname => yaml.safeLoadAll(
//       await util.promisify(fs.readFile)(fname), 'utf8'));
// }
//

const surveyText = `We\'re trying to understand our Linkerd community better.
Would you mind answering a few quick questions?

<https://docs.google.com/forms/d/e/1FAIpQLSfm0Pm8WHH3Gxb3ctOuXI3JIYNKsT-WKp6VerG8YG0irprxvg/viewform|Survey>
`;

export default async controller => {
  controller.hears(['survey'], 'direct_message', (bot, message) => {
    const _id = uuidv4();

    bot.say({
      channel: message.user,
      attachments: [
        title: 'Hi from your friends at Buoyant!',
        fallback: 'Hi from your friends at Buoyant!',
        color: 'green',
        attachment_type: 'default',
        callback_id: _id,
        text: surveyText,
        unfurl_links: true
      ]
    })
  });










  // _(await getConfigs()).flatMap().each(config => {

  //   const handler = (bot, message) => {
  //     bot.say({
  //       channel: message.user,
  //       attachments: attachements
  //     })
  //   }
  //   controller.
  // });
}
