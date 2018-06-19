import schedule from 'node-schedule';

import controller from '../components/controller';

export default () => {
  schedule.scheduleJob('* * * * * *', () => {
    console.log('nag');
  });
}
