'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EthAbi = require('web3-eth-abi');
var bs58 = require('bs58');
var ethers = require('ethers');
var EthrDIDRegistryArtifact = require('ethr-did-registry');
var EthrDIDRegistryAbi = EthrDIDRegistryArtifact.abi;
var EthrDIDRegistryAddress = EthrDIDRegistryArtifact.networks[1].address;

var PROVIDER_URL = 'https://mainnet.infura.io';
var claimKey = '0x' + Buffer.from('muPortDocumentIPFS1220', 'utf8').toString('hex') + '00'.repeat(10);

var EthereumUtils = function () {
  function EthereumUtils(providerUrl) {
    _classCallCheck(this, EthereumUtils);

    this.provider = new ethers.providers.JsonRpcProvider(providerUrl || PROVIDER_URL);
  }

  _createClass(EthereumUtils, [{
    key: 'createPublishTxParams',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ipfsHash, managementAddress) {
        var encodedHash, data, nonce, gasPrice, txParams;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                encodedHash = encodeIpfsHash(ipfsHash);
                data = encodeMethodCall('setAttribute', [managementAddress, claimKey, encodedHash, 0]);
                _context.next = 4;
                return this.provider.getTransactionCount(managementAddress);

              case 4:
                nonce = _context.sent;
                _context.next = 7;
                return this.provider.getGasPrice();

              case 7:
                gasPrice = _context.sent.toNumber();
                txParams = {
                  nonce: nonce,
                  gasPrice: gasPrice,
                  to: EthrDIDRegistryAddress,
                  data: data
                  // we need to add 500 as a gas buffer
                };
                _context.next = 11;
                return this.provider.estimateGas(_extends({}, txParams, { from: managementAddress }));

              case 11:
                _context.t0 = _context.sent.toNumber();
                txParams.gasLimit = _context.t0 + 500;
                return _context.abrupt('return', txParams);

              case 14:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function createPublishTxParams(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return createPublishTxParams;
    }()
  }, {
    key: 'calculateTxCost',
    value: function calculateTxCost(txParams) {
      return ethers.utils.formatUnits(txParams.gasPrice * txParams.gasLimit, 'ether');
    }
  }, {
    key: 'sendRawTx',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(rawTx) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt('return', this.provider.sendTransaction(rawTx));

              case 1:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function sendRawTx(_x3) {
        return _ref2.apply(this, arguments);
      }

      return sendRawTx;
    }()
  }, {
    key: 'waitForTx',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(txHash) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                return _context3.abrupt('return', this.provider.waitForTransaction(txHash, 60000));

              case 1:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function waitForTx(_x4) {
        return _ref3.apply(this, arguments);
      }

      return waitForTx;
    }()
  }]);

  return EthereumUtils;
}();

var encodeIpfsHash = function encodeIpfsHash(hash) {
  return '0x' + bs58.decode(hash).toString('hex').slice(4);
};

var encodeMethodCall = function encodeMethodCall(methodName, args) {
  var methodAbi = EthrDIDRegistryAbi.filter(function (obj) {
    return obj.name === methodName;
  })[0];
  return EthAbi.encodeFunctionCall(methodAbi, args);
};

module.exports = EthereumUtils;