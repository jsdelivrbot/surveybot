import _ from 'lodash';
import debug from 'debug';
import util from 'util';

const log = debug('user_registration');

const saveTeam = payload => {
  log('successful login', payload);

  if (!payload.identity.team_id) return log('something went wrong', payload);

  util.promisify(controller.storage.teams.get)(payload.identity.team_id)
    .then(team => {
      return util.promisify(controller.storage.teams.save)(_.merge(team, payload))
    })
    .catch(err => log('something went wrong', err, payload));
}

export default controller => {
  controller.on('oauth:success', saveTeam);
}
