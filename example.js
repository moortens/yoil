const IRCClient = require('./src/client');

const irc = new IRCClient({
  nickname: 'nick',
  username: 'user',
  realname: 'the real name',
  port: 6697,
  host: '127.0.0.1',
  tls: true,
  saslUsername: 'username',
  saslPassword: 'password',
});

irc.connect();

irc.on('registered', ({ server }) => {
  console.log(`Connected to ${server}`);
  irc.join('#channel');
});

irc.on('topic', ({ channel, nick, topic }) => {
  console.log(`${channel} -- "${topic}" by ${nick}`);
});

irc.on('account', ({ account, error }) => {
  if (error) {
    console.log('SASL unsuccessful');
  } else {
    console.log(`I successfully negotiated SASL and logged in as ${account}`);
  }
});

irc.on('privmsg', () => {
  console.log('I received a message!');
});

irc.on('join', ({ channel, nick }) => {
  irc.privmsg(channel, `Hello there, ${nick}`);
});

irc.on('part', data => {
  console.log(data);
});

irc.on('motd', data => console.log(data));
