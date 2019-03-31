const irc = require('./index');

const config = new irc.Config({
  nickname: 'nick',
  username: 'user',
  realname: 'the real name',
  port: 6697,
  host: '127.0.0.1',
  tls: true,
  saslUsername: 'username',
  saslPassword: 'password',
});

const client = new irc.Client(config);

client.connect();

client.on('registered', ({ server }) => {
  console.log(`Connected to ${server}`);
  client.join('#channel');
});

client.on('topic', ({ channel, nick, topic }) => {
  console.log(`${channel} -- "${topic}" by ${nick}`);
});

client.on('account', ({ account, error }) => {
  if (error) {
    console.log('SASL unsuccessful');
  } else {
    console.log(`I successfully negotiated SASL and logged in as ${account}`);
  }
});

client.on('privmsg', () => {
  console.log('I received a message!');
});

client.on('join', data => {
  const { channel, nick } = data;
  console.log(data);
  console.log(data.time);
  client.privmsg(channel, `Hello there, ${nick}`);
});

client.on('part', data => {
  console.log(data);
});

client.on('motd', data => console.log(data));

client.on('error', data => console.log(data));
// client.on('data', data => console.log(data))
