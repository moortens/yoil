import Base from './base';
import Event from '../event';
import Message from '../message';

function bind<T extends Function>(target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T> | void {
  if(!descriptor || (typeof descriptor.value !== 'function')) {
      throw new TypeError(`Only methods can be decorated with @bind. <${propertyKey}> is not a method!`);
  }
  
  return {
      configurable: true,
      get(this: T): T {
          const bound: T = descriptor.value!.bind(this);
          // Credits to https://github.com/andreypopp/autobind-decorator for memoizing the result of bind against a symbol on the instance.
          Object.defineProperty(this, propertyKey, {
              value: bound,
              configurable: true,
              writable: true
          });
          return bound;
      }
  };
}

function listen(event: string): any {
  return function(target: Object, 
    propertyKey: string, 
    descriptor: TypedPropertyDescriptor<any>) {
      target['listeners'][event] = propertyKey;
  }
}

class Server extends Base {
  list: Set<Object> = null;

  constructor(client) {
    super(client);
console.log(this)
    this.addCommandListener('RPL_LIST', this.listReply.bind(this));
    this.addCommandListener('RPL_LISTEND', this.listEnd.bind(this));
console.log("do i run first?")
    this.list = new Set<Object>();
  }

  @listen('RPL_LIST')
  listReply() {
    console.log(this);
  }

  listEnd(data: Message) {
    const list = Array.from(this.list);

    this.emit(
      'server::list',
      new Event(
        {
          list,
        },
        data,
      ),
    );
  }
}

export default Server;
