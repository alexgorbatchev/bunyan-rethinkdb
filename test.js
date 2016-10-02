import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import BunyanToRethinkDB from './index-es6';

chai.use(sinonChai);
const { expect } = chai;

class MockRethinkDB {
  constructor() {
    this.table = sinon.stub().returns(this);
    this.insert = sinon.stub().returns(this);
    this.run = sinon.stub().returns(this);
    this.then = sinon.stub().returns(Promise.resolve());
    this.now = sinon.stub().returns(new Date());
  }
}

function waitToBeCalled(spy, callCount = 1) {
  return new Promise(resolve => {
    const loop = () => {
      if (spy.callCount < callCount) {
        setTimeout(loop, 10);
      } else {
        resolve();
      }
    }

    loop();
  });
}

describe('bunyan-rethinkdb', () => {
  let r, connection, instance;

  beforeEach(() => {
    r = new MockRethinkDB();
    connection = Promise.resolve({ open: true });
  });

  describe('default options', () => {
    beforeEach(() => instance = new BunyanToRethinkDB(r, connection));

    it('stores data on first call', () =>
      instance.write({ foo: 1 }).then(() => {
        expect(r.table).to.be.calledOnce;
        expect(r.insert).to.be.calledWith([ { foo: 1, time: sinon.match.date } ]);
      })
    );

    it('strips undefined values', () =>
      instance.write({ foo: 1, code: undefined }).then(() => {
        expect(r.table).to.be.calledOnce;
        expect(r.insert).to.be.calledWith([ { foo: 1, time: sinon.match.date } ]);
      })
    );
  });

  describe('with buffer and no buffer timeout', () => {
    beforeEach(() => instance = new BunyanToRethinkDB(r, connection, { bufferLength: 2 }));

    it('it does not store data on first call', () =>
      instance.write({ foo: 1 }).then(() =>
        expect(r.insert).to.not.be.called
      )
    );

    it('it stores data after two calls', () =>
      instance.write({ foo: 1 }).then(() =>
        instance.write({ foo: 2 }).then(() =>
          expect(r.insert).to.be.calledOnce
        )
      )
    );
  });

  describe('with buffer and buffer timeout', () => {
    beforeEach(() => instance = new BunyanToRethinkDB(r, connection, { bufferLength: 3, bufferTimeout: 100 }));

    it('it does not store data on first call', () =>
      instance.write({ foo: 1 }).then(() =>
        expect(r.insert).to.not.be.called
      )
    );

    it('it stores data after two calls', () =>
      instance.write({ foo: 1 }).then(() =>
        instance.write({ foo: 2 }).then(() =>
          waitToBeCalled(r.insert, 1)
        )
      )
    );
  });
});
