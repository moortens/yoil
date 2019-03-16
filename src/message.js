class Message {
  constructor(data, ...params) {
    this.tags = new Map();
    this.prefix = null;
    this.nick = null;
    this.ident = null;
    this.hostname = null;
    this.command = null;
    this.params = [];

    if (data instanceof Object) {
      Object.assign(this, data, {});
    } else if (typeof data === 'string' || data instanceof String) {
      this.command = data;
      this.params = params;
    }

    if (!(this.tags instanceof Map)) {
      throw new Error('tags need to be an instance of Map');
    }

    this.timestamp = new Date();

    // fix.
    const reply = message => {
      // check if channel or privmsg
      // reply to correct target
      return message;
    };

    if (this.command === 'PRIVMSG') {
      this.reply = reply;
    }
  }

  get time() {
    if (this.tags.has('time')) {
      return new Date(this.tags.get('time'));
    }

    return this.timestamp;
  }

  get account() {
    if (this.tags.has('account')) {
      return this.tags.get('account');
    }
    return null;
  }

  set(key, value) {
    this.tags.set(key, value);
    return this;
  }

  toString() {
    let message = [];
    if (this.tags.size > 0) {
      const escapeMap = {
        ';': '\\:',
        ' ': '\\s',
        '\\': '\\\\',
        '\r': '\\r',
        '\n': '\\n',
      };

      const tags = [];
      this.tags.forEach((value, key) => {
        tags.push(
          `${key}=${value.replace(/;|\s|\\|\r|\n/gi, m => escapeMap[m])}`,
        );
      });

      message.push(`@${tags.join(';')}`);
    }

    if (!this.command) {
      return null;
    }

    message.push(this.command);

    const specialTrailingCommands = ['PRIVMSG', 'NOTICE'];
    if (
      specialTrailingCommands.includes(this.command) &&
      this.params.length === 2
    ) {
      const [target, trailing] = this.params;
      message.push(`${target} :${trailing}`);
    } else {
      message = message.concat(
        this.params
          .filter(p => {
            return p !== null && p !== undefined;
          })
          .map(p => {
            if (p.includes(' ')) {
              return `:${p}`;
            }
            return p;
          }),
      );
    }
    return message.join(' ');
  }
}

module.exports = Message;
