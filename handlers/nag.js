import _ from 'lodash';
import schedule from 'node-schedule';
import util from 'util';

import controller from '../components/controller';
import {messages} from './register';

// XXX: This is going to slow down over time with every user being saved
//      requiring calls all over the place. It should be fixed.
const nagUser = user => _.each(user, (v, k) => {
  const msg = _.find(messages, msg => msg.name === k);
  if (!msg) return;

  new msg(user.team, user.id).nag(v);
});

const getUsers = async () => {
  const users = await util.promisify(controller.storage.users.all)()
  _.each(users, nagUser);
}

export default async () => {
  // XXX - Change to a more reasonable time.
  schedule.scheduleJob('0 * * * *', () => {
    getUsers();
  });
}
