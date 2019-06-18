const Base = require('./base');
const Event = require('../event');

class Server extends Base {
  constructor(client) {
    super(client);

    this.addCommandListener('RPL_LIST', this.list.bind(this));
    this.addCommandListener('RPL_LISTEND', this.listEnd.bind(this));

    this.list = new Set();
  }

  list(data) {
    const [target, channel, users, topic] = data.params;

    this.list.add({
      target,
      channel,
      users,
      topic,
    });
  }

  listEnd(data) {
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

module.exports = Server;
