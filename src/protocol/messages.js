const Base = require('./base');

class Messages extends Base {
  constructor(client) {
    super(client);

    this.store.addDesiredCapability('draft/labeled-response');
    this.store.addDesiredCapability('draft/message-tags-0.2');
    this.store.addDesiredCapability('server-time');

    this.addCommandListener('NOTICE', this.notice.bind(this));
    this.addCommandListener('PRIVMSG', this.privmsg.bind(this));
  }

  static isCtcpMessage({ params }) {
    const message = params[params.length - 1];
    return (
      message.charCodeAt(0) === 1 &&
      message.charCodeAt(message.length - 1) === 1
    );
  }

  static isServerMessage({ prefix }, server) {
    return prefix === server || server === undefined;
  }

  static getCtcpCommandAndValue({ params }) {
    const data = params[params.length - 1].substr(
      1,
      params[params.length - 1].length - 2,
    );

    const command = data.substring(0, data.indexOf(' '));
    const value = data.substring(data.indexOf(' ') + 1);

    return [command, value];
  }

  notice(data) {
    const o = { server: false, ...data };

    o.server = Messages.isServerMessage(data, this.store.get('server'));

    if (Messages.isCtcpMessage(data)) {
      const [command, value] = Messages.getCtcpCommandAndValue(data);

      o.command = command;
      o.trailing = value;

      return this.emit('ctcp-response', o);
    }

    return this.emit('notice', o);
  }

  privmsg(data) {
    const o = { server: false, ...data };

    o.server = Messages.isServerMessage(data, this.store.get('server'));

    if (Messages.isCtcpMessage(data)) {
      const [command, value] = Messages.getCtcpCommandAndValue(data);

      o.command = command;
      o.trailing = value;

      this.emit('ctcp-request', o);
    }

    return this.emit('privmsg', o);
  }
}

module.exports = Messages;
