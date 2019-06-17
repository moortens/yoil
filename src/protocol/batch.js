const Base = require('./base');
const Event = require('../event');

class Batch extends Base {
  constructor(client) {
    super(client);

    this.store.addDesiredCapability('batch');

    this.addCommandListener('BATCH', this.batch.bind(this));
    this.batch = new Map();
  }

  batch(data) {
    const prefix = data.params[0].charCodeAt(0);
    const reference = data.params[0].substring(1);
    const [type, ...parameters] = data.params.slice(1);

    // a plus (ch. code 43) indicates the start of a batch,
    // while a minus (ch. code 45) indicates the end of a batch
    // and should emit the data stored during the batch.
    if (prefix === 43) {
      this.batch.set(reference.substring(1), {
        type,
        reference,
        parameters,
      });
    } else if (prefix === 45) {
      this.emit(
        `batch::${type}`,
        new Event(
          {
            ...this.batch.get(reference),
            data: this.store.batchedResponseCache.get(reference),
          },
          data,
        ),
      );
    }
  }
}

module.exports = Batch;
