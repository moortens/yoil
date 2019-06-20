const Base = require('./base');
const Message = require('../message');
const Event = require('../event');

class Registration extends Base {
  constructor(client) {
    super(client);

    this.store.addDesiredCapability('extended-join');

    this.addConnectionListener('socket::connected', this.register.bind(this));

    this.addCommandListener('RPL_WELCOME', this.welcome.bind(this));
    this.addCommandListener('RPL_ISUPPORT', this.isupport.bind(this));
    this.addCommandListener('RPL_MOTD', this.motd.bind(this));
    this.addCommandListener('RPL_MOTDSTART', this.motdStart.bind(this));
    this.addCommandListener('RPL_ENDOFMOTD', this.endOfMotd.bind(this));
    this.addCommandListener('ERR_NOMOTD', this.errNoMotd.bind(this));
    this.addCommandListener('ERR_PASSWDMISMATCH', this.error.bind(this));
    this.addCommandListener('ERR_ALREADYREGISTERED', this.error.bind(this));
    this.addCommandListener('ERR_YOUREBANNEDCREEP', this.error.bind(this));
    this.addCommandListener('ERR_NOPERMFORHOST', this.error.bind(this));

    this.addCommandListener('ERR_NICKNAMEINUSE', this.nicknameInUse.bind(this));
    this.addCommandListener(
      'ERR_ERRONEUSNICKNAME',
      this.erroneusNickname.bind(this),
    );

    this.addCommandListener('PING', this.ping.bind(this));

    this.motd = new Set();
  }

  register(data) {
    const { password } = this.config;

    this.emit('server::connect', new Event({}, data));

    if (password !== null && password !== undefined) {
      this.send(new Message('PASS', password));
    }

    this.send(new Message('NICK', this.config.nickname));
    this.send(
      new Message('USER', this.config.username, '0', '*', this.config.realname),
    );
  }

  welcome(data) {
    const server = data.prefix;
    const [nickname] = data.params;

    this.store.set('server', server);
    this.store.set('registered', true);

    this.emit('server::registered', new Event({ server, nickname }, data));
  }

  isupport(data) {
    // first param is target:
    data.params.shift();
    // last is the trailing message
    data.params.pop();

    data.params.forEach(token => {
      let [param, value = true] = token.split('=');

      // ensure the param is lowercase, defying the spec.
      param = param.toLowerCase();

      // if we recieve a -PARAMETER, we need to negate the value.
      // a negation does _not_ contain a value, therefore we blindly
      // set the value to false.
      if (param.charCodeAt(0) === 45) {
        return this.store.setAdvertisedFeature(param, false);
      }

      if (typeof value === 'string') {
        value = value.split(',');

        if (value.length <= 1) {
          value = value.pop() || true;
        }
      }

      return this.store.setAdvertisedFeature(param, value);
    });

    this.emit(
      'server::supports',
      new Event(Array.from(this.store.getAdvertisedFeatures()), data),
    );
  }

  motdStart() {
    this.motd = new Set();
  }

  errNoMotd(data) {
    return this.emit(
      'server::motd',
      new Event(
        {
          server: data.prefix,
          error: 'No MOTD',
        },
        data,
      ),
    );
  }

  motd(data) {
    this.motd.add(data.params.slice().pop());
  }

  endOfMotd(data) {
    this.emit(
      'server::motd',
      new Event(
        {
          server: data.prefix,
          motd: Array.from(this.motd),
        },
        data,
      ),
    );
  }

  error(data) {
    const {
      params: [client, message],
    } = data;

    this.emit(
      'error',
      new Event(
        {
          client,
          message,
        },
        data,
      ),
    );
  }

  ping(data) {
    this.send(new Message('PONG', data.params[0]));
  }

  nicknameInUse(data) {
    const [, nickname, reason] = data.params;
    const alternateNickname = this.config.fixNicknameInUseCallback
      ? Reflect.apply(this.config.fixNicknameInUseCallback, undefined, [
          nickname,
        ])
      : `${nickname}_`;

    if (this.config.fixNicknameInUse) {
      this.send(new Message('NICK', alternateNickname));
    }

    this.emit(
      'server::nickname-in-use',
      new Event(
        {
          original: nickname,
          alternate: alternateNickname,
          fixing: this.config.fixNicknameInUse,
          reason,
        },
        data,
      ),
    );
  }

  erroneusNickname(data) {
    const [, nickname, reason] = data.params;

    this.emit(
      'server::erroneous-nickname',
      new Event(
        {
          nickname,
          reason,
        },
        data,
      ),
    );
  }
}

module.exports = Registration;
