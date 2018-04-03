const coder = require('web3/lib/solidity/coder')
var CryptoJS = require('crypto-js')
const bs58 = require('bs58')
const Web3 = require('web3')
const promisifyAll = require('bluebird').promisifyAll
const RevokeAndPublishArtifact = require('ethereum-claims-registry').applications.RevokeAndPublish
const RevokeAndPublishAbi = RevokeAndPublishArtifact.abi
const RevokeAndPublishAddress = RevokeAndPublishArtifact.networks[1].address

const PROVIDER_URL = 'https://mainnet.infura.io'
const claimKey = 'muPortDocumentIPFS1220'

class EthereumUtils {

  constructor (providerUrl) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl || PROVIDER_URL))
    this.web3.eth = promisifyAll(this.web3.eth)
  }

  async createPublishTxParams (ipfsHash, managementAddress) {
    const encodedHash = encodeIpfsHash(ipfsHash)
    const data = encodeMethodCall('publish', [managementAddress, claimKey, encodedHash])
    const nonce = await this.web3.eth.getTransactionCountAsync(managementAddress)
    const gasPrice = (await this.web3.eth.getGasPriceAsync()).toNumber()
    const txParams = {
      nonce,
      gasPrice,
      to: RevokeAndPublishAddress,
      data,
    }
    // we need to add 500 as a gas buffer
    txParams.gasLimit = (await this.web3.eth.estimateGasAsync({...txParams, from: managementAddress})) + 500
    return txParams
  }

  calculateTxCost (txParams) {
    return this.web3.fromWei(txParams.gasPrice * txParams.gasLimit, 'ether')
  }

  async sendRawTx (rawTx) {
    await this.web3.eth.sendRawTransactionAsync(rawTx)
  }
}

const encodeIpfsHash = (hash) => {
  return '0x' + bs58.decode(hash).toString('hex').slice(4)
}

const encodeMethodCall = (methodName, args) => {
  const methodAbi = RevokeAndPublishAbi.filter(obj => obj.name === methodName)[0]
  const types = methodAbi.inputs.map(o => o.type)
  const fullName = methodName + '(' + types.join() + ')'
  const signature = CryptoJS.SHA3(fullName, { outputLength: 256 }).toString(CryptoJS.enc.Hex).slice(0, 8)

  return '0x' + signature + coder.encodeParams(types, args)
}

module.exports = EthereumUtils
