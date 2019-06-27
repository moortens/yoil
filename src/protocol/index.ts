import CapHandler from './cap';
import MessagesHandler from './messages';
import RegistrationHandler from './registration';
import ChannelHandler from './channel';
import BatchHandler from './batch';
import SaslHandler from './sasl';
import UserHandler from './user';
import ErrorHandler from './errors';
import ServerHandler from './server';
console.log("yo?")
export default client => {
  client.use(CapHandler);
  client.use(MessagesHandler);
  client.use(RegistrationHandler);
  client.use(ChannelHandler);
  client.use(BatchHandler);
  client.use(SaslHandler);
  client.use(UserHandler);
  client.use(ServerHandler);
  client.use(ErrorHandler);
};
