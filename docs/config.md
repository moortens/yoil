## Config

Every instance of yoil requires a config object. This config object tells yoil where to connect, the nickname, SASL authentication and so forth. 

Below is the config skeleton:

```javascript
{
  nickname: null,
  username: null,
  realname: null,

  host: null,
  port: 6697,
  password: null,

  tls: true,

  sasl: true,
  saslUsername: null,
  saslPassword: null,
  saslDisconnectOnFailure: true,
  saslPreferedMechanisms: new Set([
    'SCRAM-SHA-512',
    'SCRAM-SHA-256',
    'PLAIN',
  ]),

  autoReconnect: false,
  autoReconnectDelay: 10,
  autoReconnectMaxRetries: 3,

  fixNicknameInUse: true,
  fixNicknameInUseCallback: nick => `${nick}_`,
}
```

To initiate a client:

```javascript
const irc = require('yoil');

const config = new irc.Config({
	nickname: 'nickname',
    username: 'username',
    realname: 'Nick Name',
    
    host: '127.0.0.1',
    port: 7002,
    
    sasl: true,
    saslUsername: 'username',
    saslPassword: 'password',
    
    autoReconnect: true,
    autoReconnectDelay: 30,
});

const client = new irc.Client(config);

client.connect();

client.on('server::connect', ({ server }) => {
	console.log(`Connected to ${server}`);
});

```

### Sasl

* `config.sasl` requires a boolean to enable or disable SASL authentication
* `config.saslUsername` requires a string with your SASL username (remember: SASL username does not neccesarily equal your nickname or ident/irc username)
* `config.saslPassword` - requires a string with your SASL password
* `config.saslDisconnectOnFailure` provides a mechanism to decide whether to disconnect from IRC _if_ the SASL authentication failed. 
* `config.saslPreferedMechanisms` is a Set of prefered SASL mechanisms in descending order from most prefered to least.

#### Supported SASL mechanisms:

* SCRAM-SHA-512 
* SCRAM-SHA-256
* SCRAM-SHA-1
* PLAIN

If you provided SCRAM-SHA-512 and SCRAM-SHA-256 while the server only supports say PLAIN and EXTERNAL, the library will degrade to PLAIN without taking the prefered mechanisms into consideration as PLAIN is the only mechanism it knows. 

### Auto reconnect

 * `autoReconnect` is a boolean indicating whether the client should attempt to reconnect on non-manual disconnects (i.e. not closed by client.close())
 * `autoReconnectDelay` is the amount of seconds to delay a reconnect attempt. Concurrent attempts get delayed by the reconnect attempt. Meaning if you are on your 2nd reconnect attempt with a 10 second delay, the delay will be `10 * 2`. So the next attempt will occur 20 seconds after the last. Similarly, on the 3rd, it will occur 30 seconds after the last attempt. 
 * `autoReconnectMaxRetries` tells the library how many times to attempt reconnecting.

### Nickname in use

* `fixNicknameInUse` indicates whether to attempt to change your nickname if the original is in use.
* `fixNicknameInUseCallback` is a callback to determine the nickname to use in case the previous nickname was in use.

```javascript
Config.fixNicknameInUseCallback: nick => `${nick}_`;
```

### TLS

* `tls` indicates whether the WebSocket connection should be secure or not.