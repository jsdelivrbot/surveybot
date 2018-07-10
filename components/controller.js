import env from 'node-env-file';
import Botkit from 'botkit';

env(__dirname + '/../.env');

const bot_options = {
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  // debug: true,
  scopes: ['bot'],
  json_file_store: __dirname + '/../.data/db/',
};

const controller = Botkit.slackbot(bot_options);

controller.on('member_joined_channel', () => console.log('fail boat'));

export default controller;
