const Base = require('./base');
const Event = require('../event');

class User extends Base {
  constructor(client) {
    super(client);

    this.store.addDesiredCapability('account-notify');
    this.store.addDesiredCapability('account-tag');
    this.store.addDesiredCapability('away-notify');
    this.store.addDesiredCapability('chghost');
    this.store.addDesiredCapability('invite-notify');

    this.addCommandListener('CHGHOST', this.chghost.bind(this));
    this.addCommandListener('ACCOUNT', this.account.bind(this));
    this.addCommandListener('INVITE', this.invite.bind(this));
    this.addCommandListener('AWAY', this.invite.bind(this));
  }

  chghost(data) {
    const {
      nick,
      params: [ident, hostname],
    } = data;

    this.emit(
      'user::chghost',
      new Event(
        {
          nick,
          ident,
          hostname,
          original: {
            ident: data.ident,
            hostname: data.hostname,
          },
        },
        data,
      ),
    );
  }

  account(data) {
    const {
      nick,
      params: [account],
    } = data;
    this.emit(
      'user::account-notify',
      new Event(
        {
          nick,
          account,
        },
        data,
      ),
    );
  }

  invite(data) {
    const {
      nick,
      params: [invitedNick, channel],
    } = data;

    this.emit(
      'user::invite-notify',
      new Event(
        {
          nick: invitedNick,
          channel,
          source: {
            nick,
          },
        },
        data,
      ),
    );
  }

  away(data) {
    const {
      nick,
      params: [message = null],
    } = data;

    this.emit(
      'user::away-notify',
      new Event(
        {
          nick,
          message,
        },
        data,
      ),
    );
  }
}

module.exports = User;
