const Message = require('./message');

class Event {
  constructor(data, context = new Message()) {
    if (!(context instanceof Message)) {
      throw new Error('Context needs to be of type Message');
    }

    Object.assign(this, data, {});
    Object.defineProperty(this, 'context', {
      value: context,
    });

    return new Proxy(this, {
      get: (target, name) => {
        if (name in target) {
          return Reflect.get(target, name);
        }

        if (target.context) {
          if (target.context[name]) {
            return Reflect.get(target.context, name);
          }
        }
        return undefined;
      },
    });
  }

  tag(key) {
    if (!this.context.tags) {
      return null;
    }
    return this.context.tags.get(key);
  }
}

module.exports = Event;
