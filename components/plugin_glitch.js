import request from 'request';
import schedule from 'node-schedule';

export default () => {
  schedule.scheduleJob('* * * * *', () =>
    request({url: `http://${process.env.PROJECT_DOMAIN}.glitch.me`}));
}
