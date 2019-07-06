import Base from './base';
import Event from '../event';
import Message from '../message';
import Client from '../client';

/**
 * todo
 * - cap nak
 * - make it all nicer...
 */
class Cap extends Base {
  private supportedCapabilities: Map<string, any> = new Map();
  private acknowledgedCapabilities: string[] = [];

  private negotiating = false;

  constructor(client: Client) {
    super(client);

    this.prependConnectionListener(
      'socket::connected',
      this.initialize.bind(this),
    );

    this.addCommandListener('CAP', this.negotiate.bind(this));

    this.store.addDesiredCapability('cap-notify');
  }

  initialize() {
    this.negotiating = true;
    this.send(new Message('CAP', 'LS', '302'));
  }

  negotiate(data: Message) {
    const verb = data.params[1];

    const handlers = {
      LS: this.ls.bind(this),
      LIST: this.list.bind(this),
      ACK: this.ack.bind(this),
      NAK: this.nak.bind(this),
      NEW: this.newcap.bind(this),
      DEL: this.del.bind(this),
    };

    if (handlers[verb] === undefined) {
      this.emit('error', new Event({
        error: `Unknown CAP command sent by server: ${verb}`
      }, data));
    }

    handlers[verb].call(this, data);
  }

  list(data: Message) {
    const { params } = data;

    const capabilities = params
      .slice()
      .pop()
      .split(' ');

    this.emit(
      'cap::list',
      new Event(
        {
          ...capabilities,
        },
        data,
      ),
    );
  }

  addSupportedCapabilities(capabilities: string) {
    capabilities.split(' ').forEach(capability => {
      const [, key, value = null] = capability.match(/^([^=|$]*)(?:=(.*))?/);
      if (value) {
        this.supportedCapabilities.set(key, value.split(/,|=/));
      } else {
        this.supportedCapabilities.set(key, value);
      }
    });
  }

  ls(data: Message) {
    if (!this.negotiating) {
      return;
    }

    this.addSupportedCapabilities(data.params.slice().pop());

    if (data.params[2].charCodeAt(0) === 42) {
      return;
    }

    const requestCapabilities = new Set();

    this.store
      .getDesiredCapabilities()
      .filter((capability: string) => {
        const dependants = this.store.getDesiredCapabilityDependants(
          capability,
        );

        if (dependants.length === 0) {
          return true;
        }

        const shouldAppend = dependants.every((cap: string | string[]) => {
          if (cap instanceof Array) {
            return cap.some((c: string) => this.supportedCapabilities.has(c));
          }

          return this.supportedCapabilities.has(cap);
        });

        if (!shouldAppend) {
          return false;
        }

        dependants.forEach((cap: string | string[]) => {
          if (cap instanceof Array) {
            cap
              .filter((c: string) => this.supportedCapabilities.has(c))
              .map((c: string) => requestCapabilities.add(c));
          } else {
            requestCapabilities.add(cap);
          }
        });

        return true;
      })
      .filter((capability: string) => this.supportedCapabilities.has(capability))
      .forEach((capability: any) => requestCapabilities.add(capability));

    this.send(
      new Message('CAP', 'REQ', Array.from(requestCapabilities).join(' ')),
    );
  }

  ack(data: Message) {
    this.acknowledgedCapabilities = data.params
      .slice()
      .pop()
      .split(' ');
    this.acknowledgedCapabilities.forEach(capability => {
      this.store.addEnabledCapability(capability);
    });

    if (this.acknowledgedCapabilities.includes('sasl')) {
      this.attemptSaslAuthentication();
    } else if (this.negotiating) {
      // only send CAP END if we are not negotiating during connection phase
      this.negotiating = false;
      this.send(new Message('CAP', 'END'));
    }

    this.emit(
      'cap::ack',
      new Event(
        {
          ...this.acknowledgedCapabilities,
        },
        data,
      ),
    );
  }

  nak(data: Message) {
    const { params } = data;
    const capabilities = params
      .slice()
      .pop()
      .split(' ');

    this.emit(
      'caps::rejected',
      new Event(
        {
          ...capabilities,
        },
        data,
      ),
    );
  }

  newcap(data: Message) {
    this.addSupportedCapabilities(data.params.slice().pop());

    const requestCapabilities = this.store
      .getDesiredCapabilities()
      .filter(
        capability =>
          this.supportedCapabilities.has(capability) &&
          !this.store.hasEnabledCapability(capability),
      );

    this.send(new Message('CAP', 'REQ', requestCapabilities.join(' ')));
  }

  del(data: Message) {
    const capabilities = data.params
      .slice()
      .pop()
      .split(' ');
    capabilities.forEach(capability => {
      this.store.removeEnabledCapability(capability);
    });
  }

  attemptSaslAuthentication() {
    const preferedSaslMechanisms = this.config.saslPreferedMechanisms;
    const knownSaslMechanisms = this.supportedCapabilities.get('sasl');

    if (knownSaslMechanisms === null || knownSaslMechanisms === undefined) {
      // fallback to plain
      this.store.set('saslMechanism', 'PLAIN');
    } else {
      const m = Array.from(preferedSaslMechanisms)
        .filter(mechanism => knownSaslMechanisms.includes(mechanism))
        .shift();

      this.store.set('saslMechanism', m);
    }

    if (this.store.get('saslMechanism')) {
      this.send(new Message('AUTHENTICATE', this.store.get('saslMechanism')));
    }
  }
}

export default Cap;
