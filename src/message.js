class Message {
  constructor(data, ...params) {
    this.tags = new Map();
    this.prefix = null;
    this.nick = null;
    this.ident = null;
    this.hostname = null;
    this.command = null;
    this.params = null;

    if (data instanceof Object) {
      Object.assign(this, data, {});
    } else if (typeof data === 'string' || data instanceof String) {
      this.command = data;
      this.params = params;
    }

    if (!(this.tags instanceof Map)) {
      if (this.tags instanceof Array) {
        try {
          this.tags = new Map(this.tags);
        } catch (e) {
          return null;
        }
      } else if (this.tags instanceof Object) {
        const { tags } = this;
        this.tags = new Map();
        Object.getOwnPropertyNames(tags).forEach((val) => {
          this.tags.set(val, tags[val]);
        });
      } else {
        return null;
      }
    }


    this.timestamp = new Date();

    // fix.
    const reply = (message) => {
      // check if channel or privmsg
      // reply to correct target
      return null;
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
        tags.push(`${key}=${value.replace(/;|\s|\\|\r|\n/gi, m => escapeMap[m])}`);
      });

      message.push(tags.join(';'));
    }

    if (!this.command) {
      return null;
    }

    message.push(this.command);

    message = message.concat(this.params.map((p) => {
      if (p.includes(' ')) {
        return `:${p}`;
      }
      return p;
    }));

    return message.join(' ');
  }
}

module.exports = Message;
