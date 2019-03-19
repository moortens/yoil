const Base = require('./base');
const Message = require('../message');
const Event = require('../event');

class Registration extends Base {
  constructor(client) {
    super(client);

    this.store.addDesiredCapability('extended-join');

    this.addConnectionListener('CONNECTED', this.register.bind(this));

    this.addCommandListener('RPL_WELCOME', this.welcome.bind(this));
    this.addCommandListener('RPL_ISUPPORT', this.isupport.bind(this));
    this.addCommandListener('RPL_MOTD', this.motd.bind(this));
    this.addCommandListener('RPL_MOTDSTART', this.motdStart.bind(this));
    this.addCommandListener('RPL_ENDOFMOTD', this.endOfMotd.bind(this));
    this.addCommandListener('ERR_NOMOTD', this.errNoMotd.bind(this));

    this.motd = new Set();
  }

  register() {
    const password = this.config.get('password');

    if (password !== null && password !== undefined) {
      this.send(new Message('PASS', password));
    }

    this.send(new Message('NICK', this.config.get('nickname')));
    this.send(
      new Message(
        'USER',
        this.config.get('username'),
        '0',
        '*',
        this.config.get('realname'),
      ),
    );
  }

  welcome(data) {
    const server = data.prefix;

    this.store.set('server', server);
    this.emit('registered', new Event({ server }, data));
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
  }

  motdStart() {
    this.motd = new Set();
  }

  errNoMotd(data) {
    return this.emit(
      'motd',
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
      'motd',
      new Event(
        {
          server: data.prefix,
          motd: Array.from(this.motd),
        },
        data,
      ),
    );
  }
}

module.exports = Registration;
