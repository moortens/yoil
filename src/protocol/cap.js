const Base = require('./base');
/**
 * todo
 * - sts policy, duration, preload
 * - cap nak
 * - make it all nicer...
 */
class Cap extends Base {
  constructor(client) {
    super(client);

    this.supportedCapabilities = new Map();
    this.acknowledgedCapabilities = [];
    this.refusedCapabilities = [];

    this.prependConnectionListener('CONNECTED', this.initialize.bind(this));
    this.prependConnectionListener('DISCONNECT', this.sts.bind(this));

    this.addCommandListener('CAP', this.negotiate.bind(this));

    this.store.addDesiredCapability('cap-notify');

    this.store.addDesiredCapability('account-notify');
    this.store.addDesiredCapability('account-tag');
    this.store.addDesiredCapability('away-notify');
    this.store.addDesiredCapability('batch');
    this.store.addDesiredCapability('cap-notify');
    this.store.addDesiredCapability('chghost');
    this.store.addDesiredCapability('draft/labeled-response');
    this.store.addDesiredCapability('draft/languages');
    this.store.addDesiredCapability('draft/message-tags-0.2');
    this.store.addDesiredCapability('message-tags');
    this.store.addDesiredCapability('draft/rename');
    this.store.addDesiredCapability('draft/resume-0.3');
    this.store.addDesiredCapability('draft/setname');
    this.store.addDesiredCapability('echo-message');
    this.store.addDesiredCapability('extended-join');
    this.store.addDesiredCapability('invite-notify');
    this.store.addDesiredCapability('multi-prefix');
    this.store.addDesiredCapability('oragono.io/maxline');
    this.store.addDesiredCapability('userhost-in-names');
    //this.store.addDesiredCapability('sts');
  }

  sts(data) {
    //console.log("CLOSED")
  //  this.client.connect()
  }

  initialize() {
    this.negotiating = true;
    this.send('CAP LS 302');
  }

  negotiate(data) {
    const verb = data.params[1];

    const handlers = {
      LS: this.ls.bind(this),
      LIST: this.list.bind(this),
      ACK: this.ack.bind(this),
      NAK: this.nak.bind(this),
      NEW: this.new_.bind(this),
      DEL: this.del.bind(this),
    };

    if (handlers[verb] === undefined) {
      this.emit('error', `Unknown CAP command sent by server: ${verb}`);
    }

    handlers[verb].call(this, data);
  }

  list(data) {
    const { params } = data;

    const capabilities = params.slice().pop().split(' ');

    this.emit('caps', {
      ...capabilities,
    });
  }

  addSupportedCapabilities(capabilities) {
    capabilities.split(' ').forEach(((capability) => {
      const [, key, value = null] = capability.match(/^([^=|$]*)(?:=(.*))?/);
      if (value) {
        this.supportedCapabilities.set(key, value.split(/,|=/));
      } else {
        this.supportedCapabilities.set(key, value);
      }
    }));
  }

  ls(data) {
    if (!this.negotiating) {
      return;
    }

    this.addSupportedCapabilities(data.params.slice().pop());

    if (data.params[2].charCodeAt(0) === 42) {
      return;
    }

    if (this.supportedCapabilities.has('sts')) {
      const sts = this.supportedCapabilities.get('sts');
      if (sts[1] && !this.client.secure) {
        this.client.port = sts[1];
        this.client.secure = true;
        //return this.client.disconnect();
//console.log("HELLOOOOO")
      }
    }

    const requestCapabilities = this.store.getDesiredCapabilities().filter(
      capability => this.supportedCapabilities.has(capability),
    );

    this.send(`CAP REQ :${requestCapabilities.join(' ')}`);
  }

  ack(data) {
    this.acknowledgedCapabilities = data.params.slice().pop().split(' ');
    this.acknowledgedCapabilities.forEach((capability) => {
      this.store.addEnabledCapability(capability);
    });

    if (this.acknowledgedCapabilities.includes('sasl')) {
      this.attemptSaslAuthentication();
    } else if (this.negotiating) {
      // only send CAP END if we are not negotiating during connection phase
      this.negotiating = false;
      this.send('CAP END');
    }
  }

  nak(data) {
    const { params } = data;
    const capabilities = params.slice().pop().split(' ');

    this.emit('capsRejected', {
      ...capabilities,
    });
  }

  new_(data) {
    this.addSupportedCapabilities(data.params.slice().pop());

    const requestCapabilities = this.store.getDesiredCapabilities().filter(
      capability => this.supportedCapabilities.has(capability)
        && !this.store.hasEnabledCapability(capability),
    );

    this.send(`CAP REQ :${requestCapabilities}`);
  }

  del(data) {
    const capabilities = data.params.slice().pop().split(' ');
    capabilities.forEach((capability) => {
      this.store.removeEnabledCapability(capability);
    });
  }

  attemptSaslAuthentication() {
    const preferedSaslMechanisms = this.config.get('saslPreferedMechanisms');
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
      this.send(`AUTHENTICATE ${this.store.get('saslMechanism')}`);
    }
  }
}

module.exports = Cap;
