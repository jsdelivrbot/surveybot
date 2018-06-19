import _ from 'lodash';
import schedule from 'node-schedule';
import util from 'util';
import { DateTime } from 'luxon';

import controller from '../components/controller';

const getUsers = () => {
  // util.promisify(controller.storage.users.all)()
  //   .then(users => {
  //     console.log(users);

  //     _(users).filter(user =>

  //     return true
  //   })
  //   .catch(err => {
  //     console.log(err);
  //   });
}

export default async () => {
  // XXX - Change to a more reasonable time.
  // schedule.scheduleJob('* * * * * *', () => {
    getUsers();
  // });
}
