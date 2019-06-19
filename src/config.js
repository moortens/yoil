class Config {
  constructor(opts) {
    const defaults = {
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
    };

    Object.assign(this, defaults, opts);
  }
}

module.exports = Config;
