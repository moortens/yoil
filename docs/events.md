## Event

Events are emitted when certain actions occur on the IRC server. For instance
when you recieve a message, an event is emitted so that you can do your magic
actions with the data. 

All events emit an Event object. The event object is interesting, as it includes
the original Message object (returned by the parser). This way you can always
show a "raw" log, or do some interesting thing with the data that I've not thought
of when writing the framework.

Server events:
1. *server::connect* - when a connection to the server is established
2. *server::registered* - you've succesfully connected to IRC
3. *server::motd* - message of the day
4. *server::disconnect* - when the connection is dropped

Channel events:
1. *channel::join*
2. *channel::part*
3. *channel::topic*
4. *channel::message*
5. *channel::notice*
6. *channel::mode*

Cap events:
1. *cap::list*
2. *cap::ack*

User events:
1. *user::away*
2. *user::invite*
3. *user::chghost*
4. *user::account*

Sasl events:
1. *sasl::login*
2. *sasl::logout*
3. *sasl::error*

Generic events:
1. *error*
2. *stream* -- all events, with the original event added as type: event.

