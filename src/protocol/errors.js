const Base = require('./base');
const Numerics = require('../numerics');
const Event = require('../event');

class Errors extends Base {
  constructor(client) {
    super(client);

    const events = Base.getCommandListenerEvents().filter(name =>
      name.startsWith('ERR_'),
    );

    Object.values(Numerics)
      .filter(name => name.startsWith('ERR') && !events.includes(name))
      .forEach(name => {
        this.addCommandListener(name, this.error.bind(this));
      });
  }

  error(data) {
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
}

module.exports = Errors;
