import Base from './base';
import Event from '../event';
import Client from '../client';
import Message from '../message';

class User extends Base {
  constructor(client: Client) {
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

  chghost(data: Message) {
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

  account(data: Message) {
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

  invite(data: Message) {
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

  away(data: Message) {
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

export default User;
