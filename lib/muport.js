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
var EthereumUtils = require('./ethereum-utils');

var IPFS_CONF = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };
var ipfs = void 0;

var MuPort = function () {
  function MuPort() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, MuPort);

    if (!opts.did || !opts.document || !opts.keyring) {
      throw new Error('Data missing for restoring identity');
    }
    initIpfs(opts.ipfsConf);
    this.did = opts.did;
    this.document = opts.document;
    this.documentHash = opts.documentHash || this.did.split(':')[2];
    this.keyring = new Keyring(opts.keyring);

    // TODO - verify integrity of identity (resolving ID should result in the same did document, etc)

    this.ethUtils = new EthereumUtils(opts.rpcProviderUrl);
    registerMuportResolver(opts.ipfsConf);
  }

  (0, _createClass3.default)(MuPort, [{
    key: 'helpRecover',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(did) {
        var muportDoc;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return MuPort.resolveIdentityDocument(did);

              case 2:
                muportDoc = _context.sent;
                return _context.abrupt('return', this.keyring.decryptOneShare(muportDoc.recoveryNetwork, muportDoc.asymEncryptionKey, this.did));

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
    key: 'updateDelegates',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(delegateDids) {
        var _this2 = this;

        var didsPublicKeys, recoveryNetwork, address, txParams, costInEther, signedTx;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!(delegateDids.length !== 3)) {
                  _context4.next = 2;
                  break;
                }

                throw new Error('Must provide exactly 3 DIDs');

              case 2:
                _context4.next = 4;
                return _promise2.default.all(delegateDids.map(function () {
                  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(did) {
                    return _regenerator2.default.wrap(function _callee2$(_context2) {
                      while (1) {
                        switch (_context2.prev = _context2.next) {
                          case 0:
                            _context2.next = 2;
                            return MuPort.resolveIdentityDocument(did);

                          case 2:
                            return _context2.abrupt('return', _context2.sent.asymEncryptionKey);

                          case 3:
                          case 'end':
                            return _context2.stop();
                        }
                      }
                    }, _callee2, _this2);
                  }));

                  return function (_x4) {
                    return _ref3.apply(this, arguments);
                  };
                }()));

              case 4:
                didsPublicKeys = _context4.sent;
                _context4.next = 7;
                return this.keyring.createShares(delegateDids, didsPublicKeys);

              case 7:
                recoveryNetwork = _context4.sent;


                this.document.recoveryNetwork = recoveryNetwork;
                _context4.next = 11;
                return ipfs.addJSONAsync(this.document);

              case 11:
                this.documentHash = _context4.sent;
                address = this.keyring.getManagementAddress();
                _context4.next = 15;
                return this.ethUtils.createPublishTxParams(this.documentHash, address);

              case 15:
                txParams = _context4.sent;
                costInEther = this.ethUtils.calculateTxCost(txParams);
                signedTx = this.keyring.signManagementTx(txParams);
                return _context4.abrupt('return', {
                  address: address,
                  costInEther: costInEther,
                  finishUpdate: function () {
                    var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
                      return _regenerator2.default.wrap(function _callee3$(_context3) {
                        while (1) {
                          switch (_context3.prev = _context3.next) {
                            case 0:
                              _context3.next = 2;
                              return _this2.ethUtils.sendRawTx(signedTx);

                            case 2:
                            case 'end':
                              return _context3.stop();
                          }
                        }
                      }, _callee3, _this2);
                    }));

                    function finishUpdate() {
                      return _ref4.apply(this, arguments);
                    }

                    return finishUpdate;
                  }()
                });

              case 19:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function updateDelegates(_x3) {
        return _ref2.apply(this, arguments);
      }

      return updateDelegates;
    }()
  }, {
    key: 'serializeState',
    value: function serializeState() {
      return {
        did: this.did,
        document: this.document,
        documentHash: this.documentHash,
        keyring: this.keyring.serialize()
      };
    }
  }], [{
    key: 'newIdentity',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(name, delegateDids) {
        var _this3 = this;

        var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var publicProfile, keyring, recoveryNetwork, symEncryptedDelegateDids, didsPublicKeys, publicKeys, doc, docHash, did;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                initIpfs(opts.ipfsConf);
                publicProfile = { name: name };
                keyring = new Keyring();
                recoveryNetwork = void 0;
                symEncryptedDelegateDids = void 0;

                if (!delegateDids) {
                  _context6.next = 13;
                  break;
                }

                _context6.next = 8;
                return _promise2.default.all(delegateDids.map(function () {
                  var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(did) {
                    return _regenerator2.default.wrap(function _callee5$(_context5) {
                      while (1) {
                        switch (_context5.prev = _context5.next) {
                          case 0:
                            _context5.next = 2;
                            return MuPort.resolveIdentityDocument(did);

                          case 2:
                            return _context5.abrupt('return', _context5.sent.asymEncryptionKey);

                          case 3:
                          case 'end':
                            return _context5.stop();
                        }
                      }
                    }, _callee5, _this3);
                  }));

                  return function (_x8) {
                    return _ref6.apply(this, arguments);
                  };
                }()));

              case 8:
                didsPublicKeys = _context6.sent;
                _context6.next = 11;
                return keyring.createShares(delegateDids, didsPublicKeys);

              case 11:
                recoveryNetwork = _context6.sent;


                symEncryptedDelegateDids = delegateDids.map(function (did) {
                  return keyring.symEncrypt(didToBuffer(did));
                });

              case 13:
                publicKeys = keyring.getPublicKeys();
                doc = createMuportDocument(publicKeys, recoveryNetwork, publicProfile, { symEncDids: symEncryptedDelegateDids });
                _context6.next = 17;
                return ipfs.addJSONAsync(doc);

              case 17:
                docHash = _context6.sent;
                did = 'did:muport:' + docHash;
                return _context6.abrupt('return', new MuPort((0, _extends3.default)({
                  did: did,
                  document: doc,
                  documentHash: docHash,
                  keyring: keyring.serialize()
                }, opts)));

              case 20:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function newIdentity(_x6, _x7) {
        return _ref5.apply(this, arguments);
      }

      return newIdentity;
    }()
  }, {
    key: 'recoverIdentity',
    value: function () {
      var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(did, shares) {
        var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                initIpfs(opts.ipfsConf);
                _context7.t0 = MuPort;
                _context7.t1 = _extends3.default;
                _context7.t2 = did;
                _context7.next = 6;
                return MuPort.resolveIdentityDocument(did);

              case 6:
                _context7.t3 = _context7.sent;
                _context7.next = 9;
                return Keyring.recoverKeyring(shares);

              case 9:
                _context7.t4 = _context7.sent.serialize();
                _context7.t5 = {
                  did: _context7.t2,
                  document: _context7.t3,
                  keyring: _context7.t4
                };
                _context7.t6 = opts;
                _context7.t7 = (0, _context7.t1)(_context7.t5, _context7.t6);
                return _context7.abrupt('return', new _context7.t0(_context7.t7));

              case 14:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function recoverIdentity(_x10, _x11) {
        return _ref7.apply(this, arguments);
      }

      return recoverIdentity;
    }()
  }, {
    key: 'resolveIdentityDocument',
    value: function () {
      var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(did) {
        var didDoc, publicKeys, recoveryNetwork, publicProfile, symEncryptedData;
        return _regenerator2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return resolve(did);

              case 2:
                didDoc = _context8.sent;
                publicKeys = {
                  signingKey: didDoc.publicKey.find(function (key) {
                    return key.id.indexOf('#signingKey') !== -1;
                  }).publicKeyHex,
                  managementKey: didDoc.publicKey.find(function (key) {
                    return key.id.indexOf('#managementKey') !== -1;
                  }).publicKeyHex,
                  asymEncryptionKey: didDoc.publicKey.find(function (key) {
                    return key.id.indexOf('#encryptionKey') !== -1;
                  }).publicKeyBase64
                };
                recoveryNetwork = didDoc.muportData.recoveryNetwork;
                publicProfile = {
                  name: didDoc.muportData.nym
                };
                symEncryptedData = didDoc.muportData.symEncryptedData;
                return _context8.abrupt('return', createMuportDocument(publicKeys, recoveryNetwork, publicProfile, symEncryptedData));

              case 8:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function resolveIdentityDocument(_x12) {
        return _ref8.apply(this, arguments);
      }

      return resolveIdentityDocument;
    }()
  }]);
  return MuPort;
}();

var initIpfs = function initIpfs(ipfsConf) {
  ipfs = promisifyAll(new IPFS(ipfsConf || IPFS_CONF));
};

var createMuportDocument = function createMuportDocument(publicKeys, recoveryNetwork, publicProfile, symEncryptedData) {
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