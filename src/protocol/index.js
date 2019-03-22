const CapHandler = require('./cap');
const MessagesHandler = require('./messages');
const RegistrationHandler = require('./registration');
const ChannelHandler = require('./channel');
const BatchHandler = require('./batch');
const SaslHandler = require('./sasl');
const ErrorHandler = require('./errors');

module.exports = client => {
  client.use(CapHandler);
  client.use(MessagesHandler);
  client.use(RegistrationHandler);
  client.use(ChannelHandler);
  client.use(BatchHandler);
  client.use(SaslHandler);
  client.use(ErrorHandler);
};
