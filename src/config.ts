class Config {
  nickname: string = null;
  username: string = null;
  realname: string = null;

  host: string = null;
  port: number = 6697;
  password: string = null;

  tls: boolean = true;

  sasl: boolean = true;
  saslUsername: string = null;
  saslPassword: string = null;
  saslDisconnectOnFailure: boolean = true;
  saslPreferedMechanisms: Set<string> = new Set([
    'SCRAM-SHA-512',
    'SCRAM-SHA-256',
    'PLAIN',
  ]);

  autoReconnect: boolean = false;
  autoReconnectDelay: number = 10;
  autoReconnectMaxRetries: number = 3;

  fixNicknameInUse: boolean = true;
  fixNicknameInUseCallback: Function = (nick: String) => `${nick}_`;

  constructor(opts: object) {
    Object.assign(this, opts);

    if (
      !this.nickname ||
      !this.username ||
      !this.realname ||
      !this.host ||
      !this.port
    ) {
      throw new Error(
        'Config needs to have nickname, username, realname, host and port provided',
      );
    }
  }
}

export default Config;
