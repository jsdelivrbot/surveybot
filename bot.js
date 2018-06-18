
import env from 'node-env-file';
import Botkit from 'botkit';
import path from 'path';
import fs from 'fs';

import server from './components/server';
import keepalive from './components/plugin_glitch';
import registration from './components/user_registration';

import registerHandlers from './handlers/register';

env(__dirname + '/.env');

const bot_options = {
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  // debug: true,
  scopes: ['bot'],
  json_file_store: __dirname + '/.data/db/',
};

const controller = Botkit.slackbot(bot_options);

controller.startTicking();

const webserver = server(controller);

webserver.get('/', function(req, res){
  res.render('index', {
    domain: req.get('host'),
    protocol: req.protocol,
    glitch_domain:  process.env.PROJECT_DOMAIN,
    layout: 'layouts/default'
  });
});

keepalive();
registration(controller);
registerHandlers(controller);
