## yoil - yet (an)other irc library
[![Build Status](https://travis-ci.org/moortens/yoil.svg?branch=master)](https://travis-ci.org/moortens/yoil)

**yoil** is a simple, yet fairly flexible IRC library written in JavaScript. It is intended for web-based IRC communication, and therefore only provides a WebSocket transport. 

#### Features:
* **Adaptive requesting of IRCv3 capabilities**: some IRCv3 caps require other caps to actually be useful (I'm looking at you *echo-message*). Therefore, yoil checks if a capabilities dependants are present before requesting.
* **SASL mechanisms**: Since *PLAIN* is so easy to implement, I decided to implement *SCRAM-SHA-256* and *SCRAM-SHA-512* support (oh, and SCRAM-SHA-1, but don't use that)
* **Namespaced events**: Events are provided in namespaces depending on where the event belongs. The most interesting thing this does, is provide a way to distinguish between private messages and channel messages, using *user::privmsg* and *channel::privmsg* respectively.
* **And a lot more**, like auto reconnecting, automatically changing your nick if its in use, and a few other features.

#### IRCv3 support:

|Feature|Support|
|---|:-:|
|CAP|:heavy_check_mark:|
|CAP 302|:heavy_check_mark:|
|cap-notify|:heavy_check_mark:|
|account-notify|:heavy_check_mark:|
|account-tag|:heavy_check_mark:|
|away-notify|:heavy_check_mark:|
|batch |:heavy_check_mark:|
|chghost|:heavy_check_mark:|
|echo-message|:heavy_check_mark:|
|extended-join|:heavy_check_mark:|
|invite-notify|:heavy_check_mark:|
|message-tags|:heavy_check_mark:|
|monitor |:x:|
|msgid |:heavy_check_mark:|
|multi-prefix|:heavy_check_mark:|
|sasl v3.1|:heavy_check_mark:|
|sasl v3.2|:heavy_check_mark:|
|server-time|:heavy_check_mark:|
|sts|:x:|
|userhost-in-names|:heavy_check_mark:|
|webirc|:x:|

#### Example:

Here is a simple example:

```javascript
const irc = require('yoil');

const config = new irc.Config({
  nickname: 'nickname',
  username: 'username',
  realname: 'realname',
  
  port: 7002,
  host: '127.0.0.1',
  
  tls: true,
  
  saslUsername: 'username',
  saslPassword: 'password',

  autoReconnect: true,
});

const client = new irc.Client(config);

client.connect();

client.on('server::registered', ({ server }) => {
  console.log(`Connected to ${server}`);
});

client.on('sasl::account', ({ account, error }) => {
  if (error) {
    console.log('SASL unsuccessful');
  } else {
    console.log(`I successfully negotiated SASL and logged in as ${account}`);
  }
});

client.on('server::erroneous-nickname', data => {
  console.log(data);
});
```