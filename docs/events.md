## Event

Events are emitted when certain actions occur on the IRC server. For instance
when you recieve a message, an event is emitted so that you can do your magic
actions with the data. 

All events emit an Event object. The event object is interesting, as it includes
the original Message object (returned by the parser). This way you can always
show a "raw" log, or do some interesting thing with the data that I've not thought
of when writing the framework.

Socket events:
1. *socket::connected* - a raw socket has been established
	```javascript
    {}
    ```
2. *socket::disconnected* - the socket has lost its connection
    ```javascript	
    {}
    ```
3. *socket::reconnect* - a reconnect attempt has started
	```javascript
    {
    	event: 'socket::reconnect',
    	retry: 1,
        max: 3,
    }
    ```
4. *socket::data* - low-level parsed lines from IRC before middleware events. This is also what is found in the Event object's *context* property.
	```javascript
    {
    	command: 'PRIVMSG',
		hostname: 'hostname',
		ident: 'ident',
		message: ':nickname!ident@hostname PRIVMSG #channel :text',
		nick: 'nickname',
		params: ['#channel', 'text']
		prefix: "nickname!ident@hostname"
		tags: Map(0) {}
    }
    ```

Server events:
1. *server::connect* - triggers on *socket::connected* when a connection to the server is established
	```javascript
    {
    	event: 'server::connect',
    	context: {...}
    }
    ```
2. *server::registered* - you've succesfully connected to IRC
	```javascript
	{
    	event: 'server::registered',
        server: 'localhost',
        nickname: 'nickname',
        context: {...}
    }
	```
3. *server::motd* - message of the day
	```javascript
    {
    	event: 'server::motd',
        motd: [
        	"first message of the day line",
            "second...",
        ],
        server: 'localhost',
    }
    ```
4. *server::disconnect* - when the connection is dropped
	```javascript
    {
    	event: 'server::disconnect',
    }
    ```
5. *server::nickname-in-use* - nick was in use. If fixing is true, the library automatically attempted to fix the problem. If false, it's up to the client to fix the problem. Alternate nick can be defined by providing a callback function to your config as *fixNicknameInUseCallback* (see config docs for more information). 
	```javascript
    {
    	event: 'server::nickname-in-use',
        original: 'nickname',
        alternate: 'nickname_',
        reason: 'Nickname in use',
        fixing: true,
    }
    ```
6. *server::erroneous-nickname* - nick is badly formatted
7. *server::notice*
8. *server::privmsg*
9. *server::supports* - sends the advertised features supported by the ircd. Event can be sent multiple times, depending on how many RPL_ISUPPORT numerics are sent by the server. 
    ```javascript
    {
        event: 'server::supports',
        network: 'network',
        chantypes: '#',
        ...rest,
    }
    ```

Channel events:
1. *channel::join*
2. *channel::part*
3. *channel::topic*
4. *channel::message*
5. *channel::notice*
6. *channel::mode*
7. *channel::kick*
8. *channel::quit*
9. *channel::privmsg*
10. *channel::notice*

Cap events:
1. *cap::list*
2. *cap::ack*
3. *cap::rejected*

User events:
1. *user::away*
2. *user::invite*
3. *user::chghost*
4. *user::account*
5. *user::privmsg*
6. *user::notice*

Sasl events:
1. *sasl::login*
2. *sasl::logout*
3. *sasl::error*

Generic events:
1. *error*
2. *stream* -- all events, with the original event added as type: event.
3. *batch* -- if labeled-response is negotiated, commands will be prepended with a label
