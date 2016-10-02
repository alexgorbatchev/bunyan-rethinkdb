import recursiveOmitBy from 'recursive-omit-by';

export default class BunyanToRethinkDB {
  constructor(r, connectionOrPromiseOf, opts = {}) {
    opts.bufferLength = opts.bufferLength || 1;
    opts.bufferTimeout = opts.bufferTimeout || 0;
    opts.tableName = opts.tableName || 'bunyan_logs';

    this._buffer = [];
    this.r = r;
    this.opts = opts;
    this.connection = typeof connectionOrPromiseOf.then !== 'function'
      ? Promise.resolve(connectionOrPromiseOf)
      : connectionOrPromiseOf;

    process.on('beforeExit', () => this._checkBuffer());
  }

  write(data) {
    if (typeof data !== 'object') {
      throw new Error('bunyan-rethinkdb requires a raw stream. Please define the type as raw when setting up the bunyan stream.');
    }

    const cleanObject = recursiveOmitBy(data, ({ node }) => typeof node === 'undefined');

    cleanObject.time = this.r.now();

    this._buffer.push(cleanObject);
    return this._checkBuffer();
  }

  _checkBuffer() {
    if (this._buffer.length >= this.opts.bufferLength) {
      return this._processBuffer();
    }

    if (this.opts.bufferTimeout) {
      clearTimeout(this._timeoutId);
      this._timeoutId = setTimeout(() => this._processBuffer(), this.opts.bufferTimeout);
    }

    return Promise.resolve();
  }

  _processBuffer() {
    if (this._buffer.length === 0) {
      return Promise.resolve();
    }

    return this.connection.then(connection => this
      .r
        .table(this.opts.tableName)
        .insert(this._buffer)
        .run(connection)
        .then(() => this._buffer = [])
    )
    .catch(err => console.error(err.stack))
    ;
  }
}
