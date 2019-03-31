class Config {
  constructor(opts) {
    const defaults = {
      nickname: null,
      username: null,
      realname: null,

      host: null,
      port: 6697,
      password: null,

      webirc: false,
      webircGateway: null,
      webircPassword: null,

      tls: true,
      tlsCipher: null,
      tlsCert: null,
      tlsKey: null,
      tlsRejectUnauthorized: false,

      sasl: true,
      saslUsername: null,
      saslPassword: null,
      saslMechanism: null,
      saslDisconnectOnFailure: true,
      saslPreferedMechanisms: new Set([
        'SCRAM-SHA-512',
        'SCRAM-SHA-256',
        'PLAIN',
      ]),

      autoReconnect: false,
      autoReconnectDelay: 60,
      autoReconnectMaxRetries: 3,
    };

    Object.assign(this, defaults, opts);
  }
}

module.exports = Config;
