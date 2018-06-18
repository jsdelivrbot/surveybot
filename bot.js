import controller from './components/controller';
import events from './components/events';
import server from './components/server';
import keepalive from './components/plugin_glitch';
import registration from './components/user_registration';

import registerHandlers from './handlers/register';

controller.startTicking();

const webserver = server(controller);

webserver.get('/', (req, res) => res.render('index', {
  domain: req.get('host'),
  protocol: req.protocol,
  glitch_domain:  process.env.PROJECT_DOMAIN,
  layout: 'layouts/default'
}));

webserver.get('/callback/:id', (req, res) => {
  events.emit(JSON.stringify({name: 'callback', id: req.id}));

  res.redirect(
    'https://docs.google.com/forms/d/e/1FAIpQLSfm0Pm8WHH3Gxb3ctOuXI3JIYNKsT-WKp6VerG8YG0irprxvg/viewform');
});

keepalive();
registration();
registerHandlers();
