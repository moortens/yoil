const Base = require('./base');
const Event = require('../event');

class Batch extends Base {
  constructor(client) {
    super(client);

    this.store.addDesiredCapability('batch');
    this.store.addDesiredCapability(
      [
        'draft/labeled-response',
        'draft/labeled-response-0.2',
        'labeled-response',
      ],
      ['batch'],
    );

    this.addCommandListener('BATCH', this.batch.bind(this));
    this.addCommandListener('ACK', this.ack.bind(this));

    this.batch = new Map();
  }

  batch(data) {
    const prefix = data.params[0].charCodeAt(0);
    const reference = data.params[0].substring(1);

    // a plus (ch. code 43) indicates the start of a batch,
    // while a minus (ch. code 45) indicates the end of a batch
    // and should emit the data stored during the batch.
    if (prefix === 43) {
      const [type, ...parameters] = data.params.slice(1);

      let label = null;

      if (
        this.store.isEnabledCapability([
          'draft/labeled-response',
          'draft/labeled-response-0.2',
          'labeled-response',
        ])
      ) {
        if (data.tags.has('label')) {
          label = data.tags.get('label');
        } else if (data.tags.has('draft/label')) {
          label = data.tags.get('draft/label');
        }
      }

      this.batch.set(reference, {
        type,
        reference,
        parameters,
        label,
      });
    } else if (prefix === 45) {
      this.emit(
        'batch',
        new Event(
          {
            ...this.batch.get(reference),
            data: Array.from(this.store.batchedResponseCache.get(reference)),
          },
          data,
        ),
      );

      this.store.batchedResponseCache.delete(reference);
      this.batch.delete(reference);
    }
  }

  ack(data) {
    if (!data.tags.has('label') && !data.tags.has('draft/label')) {
      this.emit(
        'server::ack',
        new Event(
          {
            error: 'Unknown acknowledgement',
          },
          data,
        ),
      );
    }
    const label = data.tags.get('label') || data.tags.has('draft/label');

    this.emit(
      'server::ack',
      new Event(
        {
          label,
        },
        data,
      ),
    );
  }
}

module.exports = Batch;
