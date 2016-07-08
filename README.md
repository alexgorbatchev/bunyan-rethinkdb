# bunyan-rethinkdb

[![GratiPay](https://img.shields.io/gratipay/user/alexgorbatchev.svg)](https://gratipay.com/alexgorbatchev/)
![Downloads](https://img.shields.io/npm/dm/bunyan-rethinkdb.svg)
![Version](https://img.shields.io/npm/v/bunyan-rethinkdb.svg)

[Bunyan](https://github.com/trentm/node-bunyan) logger that sends data to RethinkDB.

## Installation

`bunyan-rethinkdb` expects that you have already installed `rethinkdb`.

```
npm instal --save-dev bunyan-rethinkdb
```

## Usage

`bunyan-rethinkdb` expects the follow:

* You have already created `bunyan_logs` (or another table configured via `tableName` option)
* You have already opened your connection

```js
import bunyan from 'bunyan';
import BunyanToRethinkDB from 'bunyan-rethinkdb';
import r from 'rethinkdb';

// open RethinkDB connection first
// const connection = ...

const stream = new BunyanToRethinkDB(r, connection);
const logger = bunyan.createLogger({
  name: 'rethinkdb',
  streams: [
    { stream: process.stdout },
    { type: 'raw', stream }
  ]
});
 
logger.info({ foo: 1 }, 'Hello world!');
```

## Options

Constructor takes an optional third value with options: `new BunyanToRethinkDB(r, connection, options)`

### bufferLength

Whenever buffer reaches number of log messages specified by `bufferLength`, all messages will be sent to RethinkDB. Default value is `1`.

### bufferTimeout

Buffer will be sent to RethinkDB every `bufferTimeout` milliseconds. Zero disables this feature. Default value is `0`.

### tableName

RethinkDB table name. Default value is `bunyan_logs`.

## License

ISC
