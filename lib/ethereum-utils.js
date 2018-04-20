'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var coder = require('web3/lib/solidity/coder');
var CryptoJS = require('crypto-js');
var bs58 = require('bs58');
var ethers = require('ethers');
var promisifyAll = require('bluebird').promisifyAll;
var RevokeAndPublishArtifact = require('ethereum-claims-registry').applications.RevokeAndPublish;
var RevokeAndPublishAbi = RevokeAndPublishArtifact.abi;
var RevokeAndPublishAddress = RevokeAndPublishArtifact.networks[1].address;

var PROVIDER_URL = 'https://mainnet.infura.io';
var claimKey = 'muPortDocumentIPFS1220';

var EthereumUtils = function () {
  function EthereumUtils(providerUrl) {
    (0, _classCallCheck3.default)(this, EthereumUtils);

    this.provider = new ethers.providers.JsonRpcProvider(providerUrl || PROVIDER_URL);
  }

  (0, _createClass3.default)(EthereumUtils, [{
    key: 'createPublishTxParams',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(ipfsHash, managementAddress) {
        var encodedHash, data, nonce, gasPrice, txParams;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                encodedHash = encodeIpfsHash(ipfsHash);
                data = encodeMethodCall('publish', [managementAddress, claimKey, encodedHash]);
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
                  to: RevokeAndPublishAddress,
                  data: data
                  // we need to add 500 as a gas buffer
                };
                _context.next = 11;
                return this.provider.estimateGas((0, _extends3.default)({}, txParams, { from: managementAddress }));

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
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(rawTx) {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
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
      var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(txHash) {
        return _regenerator2.default.wrap(function _callee3$(_context3) {
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
  var methodAbi = RevokeAndPublishAbi.filter(function (obj) {
    return obj.name === methodName;
  })[0];
  var types = methodAbi.inputs.map(function (o) {
    return o.type;
  });
  var fullName = methodName + '(' + types.join() + ')';
  var signature = CryptoJS.SHA3(fullName, { outputLength: 256 }).toString(CryptoJS.enc.Hex).slice(0, 8);

  return '0x' + signature + coder.encodeParams(types, args);
};

module.exports = EthereumUtils;