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
  console.log('Connected to ' + server)
});

irc.on('account', ({ account, error }) => {
  if (error) {
    console.log('SASL unsuccessful');
  } else {
    console.log('I successfully negotiated SASL and logged in as ' + account);
  }
});

irc.on('privmsg', (data) => {
  console.log('I received a message!');
});

irc.on('motd', data => console.log(data));
