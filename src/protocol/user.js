const Base = require('./base');
const Event = require('../event');

class User extends Base {
  constructor(client) {
    super(client);

    this.addCommandListener('CHGHOST', this.chghost.bind(this));
    this.addCommandListener('ACCOUNT', this.account.bind(this));
    this.addCommandListener('INVITE', this.invite.bind(this));
  }

  chghost(data) {
    const {
      nick,
      params: [ident, hostname],
    } = data;

    this.emit(
      'chghost',
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
      'account-notify',
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
      'invite-notify',
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
}

module.exports = User;
