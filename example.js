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

client.on('server::egistered', ({ server }) => {
  console.log(`Connected to ${server}`);
  client.join('#channel');
});

client.on('channel::topic', ({ channel, nick, topic }) => {
  console.log(`${channel} -- "${topic}" by ${nick}`);
});

client.on('sasl::login', ({ account, error }) => {
  if (error) {
    console.log('SASL unsuccessful');
  } else {
    console.log(`I successfully negotiated SASL and logged in as ${account}`);
  }
});

client.on('privmsg', () => {
  console.log('I received a message!');
});

client.on('channel::join', data => {
  const { channel, nick } = data;
  client.privmsg(channel, `Hello there, ${nick}`);
});

client.on('channel::part', data => {
  console.log(data);
});

client.on('server::motd', data => console.log(data));

client.on('error', data => console.log(data));

client.on('stream', data => console.log(data.type));
// client.on('data', data => console.log(data))
