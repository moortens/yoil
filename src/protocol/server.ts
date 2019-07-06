import Base from './base';
import Event from '../event';
import Message from '../message';

class Server extends Base {
  list: Set<Object> = null;

  constructor(client) {
    super(client);

    this.addCommandListener('RPL_LIST', this.listReply.bind(this));
    this.addCommandListener('RPL_LISTEND', this.listEnd.bind(this));

    this.list = new Set<Object>();
  }

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
