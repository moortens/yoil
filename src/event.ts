import Message from './message';

class DispatchedEvent {
  private context: Message = null;

  constructor(data: object, context: Message) {
    Object.assign(this, data, {});
    
    this.context = context;

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

  tag(key: string) {
    if (!this.context.tags) {
      return null;
    }
    return this.context.tags.get(key);
  }
}

export default DispatchedEvent;
