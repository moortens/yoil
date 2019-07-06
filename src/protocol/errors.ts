import Base from './base';
import Numerics from '../numerics';
import Event from '../event';
import Client from '../client';
import Message from '../message';

class Errors extends Base {
  constructor(client: Client) {
    super(client);

    this.addCommandListener('WARN', this.standardReplies.bind(this));
    this.addCommandListener('NOTE', this.standardReplies.bind(this));
    this.addCommandListener('FAIL', this.standardReplies.bind(this));

    const events = Base.getCommandListenerEvents().filter(name =>
      name.startsWith('ERR_'),
    );

    Object.values(Numerics)
      .filter(name => name.startsWith('ERR') && !events.includes(name))
      .forEach(name => {
        this.addCommandListener(name, this.error.bind(this));
      });
  }

  error(data: Message) {
    const {
      params: [client, ...params],
    } = data;
    this.emit(
      'error',
      new Event(
        {
          client,
          params,
        },
        data,
      ),
    );
  }

  standardReplies(data: Message) {
    const [type, command, code] = data.params;
    const description = data.params[data.params.length - 1];

    let context = [];
    if (data.params.length > 4) {
      context = data.params.slice(3, data.params.length - 2);
    }

    this.emit(
      `server::${data.command.toLowerCase()}`,
      new Event(
        {
          type,
          command,
          code,
          context,
          description,
        },
        data,
      ),
    );
  }
}

export default Errors;
