'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var IPFS = require('ipfs-mini');
var promisifyAll = require('bluebird').promisifyAll;
var resolve = require('did-resolver');
var registerMuportResolver = require('muport-did-resolver');
var bs58 = require('bs58');
var Keyring = require('./keyring');

registerMuportResolver();
var IPFS_CONF = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };
var ipfs = promisifyAll(new IPFS(IPFS_CONF));

var MuPort = function () {
  function MuPort() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MuPort);

    if (!opts.did || !opts.document || !opts.keyring) {
      throw new Error('Data missing for restoring identity');
    }
    this.did = opts.did;
    this.document = opts.document;
    this.keyring = new Keyring(opts.keyring);
  }

  (0, _createClass3.default)(MuPort, [{
    key: 'helpRecover',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(did) {
        var didDoc;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return resolve(did);

              case 2:
                didDoc = _context.sent;
                return _context.abrupt('return', this.keyring.decryptOneShare(didDoc.recoveryNetwork, didDoc.asymEncryptionKey, this.did));

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function helpRecover(_x2) {
        return _ref.apply(this, arguments);
      }

      return helpRecover;
    }()
  }, {
    key: 'getDid',
    value: function getDid() {
      return this.did;
    }
  }, {
    key: 'getDidDocument',
    value: function getDidDocument() {
      return this.document;
    }
  }, {
    key: 'getRecoveryDelegateDids',
    value: function getRecoveryDelegateDids() {
      var _this = this;

      var toBuffer = true;
      var dids = [];
      if (this.document.symEncryptedData.symEncDids != undefined) {
        dids = this.document.symEncryptedData.symEncDids.map(function (encDid) {
          return bufferToDid(_this.keyring.symDecrypt(encDid.ciphertext, encDid.nonce, toBuffer));
        });
      }
      return dids;
    }
  }, {
    key: 'serializeState',
    value: function serializeState() {
      return {
        did: this.did,
        document: this.document,
        keyring: this.keyring.serialize()
      };
    }
  }], [{
    key: 'newIdentity',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(name, delegateDids) {
        var _this2 = this;

        var publicProfile, keyring, recoveryNetwork, symEncryptedDelegateDids, didsPublicKeys, publicKeys, doc, did;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                publicProfile = { name: name };
                keyring = new Keyring();
                recoveryNetwork = void 0;
                symEncryptedDelegateDids = void 0;

                if (!delegateDids) {
                  _context3.next = 12;
                  break;
                }

                _context3.next = 7;
                return _promise2.default.all(delegateDids.map(function () {
                  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(did) {
                    return _regenerator2.default.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            _context2.next = 2;
                            return resolve(did);

                          case 2:
                            return _context2.abrupt('return', _context2.sent.asymEncryptionKey);

                          case 3:
                          case 'end':
                            return _context2.stop();
                        }
                      }
                    }, _callee2, _this2);
                  }));

                  return function (_x5) {
                    return _ref3.apply(this, arguments);
                  };
                }()));

              case 7:
                didsPublicKeys = _context3.sent;
                _context3.next = 10;
                return keyring.createShares(delegateDids, didsPublicKeys);

              case 10:
                recoveryNetwork = _context3.sent;


                symEncryptedDelegateDids = delegateDids.map(function (did) {
                  return keyring.symEncrypt(didToBuffer(did));
                });

              case 12:
                publicKeys = keyring.getPublicKeys();
                doc = createDidDocument(publicKeys, recoveryNetwork, publicProfile, { symEncDids: symEncryptedDelegateDids });
                _context3.next = 16;
                return ipfs.addJSONAsync(doc);

              case 16:
                _context3.t0 = _context3.sent;
                did = 'did:muport:' + _context3.t0;
                return _context3.abrupt('return', new MuPort({
                  did: did,
                  document: doc,
                  keyring: keyring.serialize()
                }));

              case 19:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function newIdentity(_x3, _x4) {
        return _ref2.apply(this, arguments);
      }

      return newIdentity;
    }()
  }, {
    key: 'recoverIdentity',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(did, shares) {
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.t0 = MuPort;
                _context4.t1 = did;
                _context4.next = 4;
                return resolve(did);

              case 4:
                _context4.t2 = _context4.sent;
                _context4.next = 7;
                return Keyring.recoverKeyring(shares);

              case 7:
                _context4.t3 = _context4.sent.serialize();
                _context4.t4 = {
                  did: _context4.t1,
                  document: _context4.t2,
                  keyring: _context4.t3
                };
                return _context4.abrupt('return', new _context4.t0(_context4.t4));

              case 10:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function recoverIdentity(_x6, _x7) {
        return _ref4.apply(this, arguments);
      }

      return recoverIdentity;
    }()
  }, {
    key: 'resolveIdentityDocument',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(did) {
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt('return', resolve(did));

              case 1:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function resolveIdentityDocument(_x8) {
        return _ref5.apply(this, arguments);
      }

      return resolveIdentityDocument;
    }()
  }]);
  return MuPort;
}();

var createDidDocument = function createDidDocument(publicKeys, recoveryNetwork, publicProfile, symEncryptedData) {
  // TODO - this is not a real did document
  var doc = (0, _extends3.default)({
    version: 1
  }, publicKeys);
  if (recoveryNetwork) {
    doc.recoveryNetwork = recoveryNetwork;
  }
  if (publicProfile) {
    doc.publicProfile = publicProfile;
  }
  if (symEncryptedData) {
    doc.symEncryptedData = symEncryptedData;
  }
  return doc;
};

var bufferToDid = function bufferToDid(didBuffer) {
  return 'did:muport:' + bs58.encode(didBuffer);
};

var didToBuffer = function didToBuffer(didUri) {
  var hash = didUri.split(':')[2];
  return bs58.decode(hash);
};

module.exports = MuPort;