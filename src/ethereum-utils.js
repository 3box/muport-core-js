const coder = require('web3/lib/solidity/coder')
var CryptoJS = require('crypto-js')
const bs58 = require('bs58')
const Web3 = require('web3')
const promisifyAll = require('bluebird').promisifyAll
const RevokeAndPublishArtifact = require('ethereum-claims-registry').extensions.RevokeAndPublish
const RevokeAndPublishAbi = RevokeAndPublishArtifact.abi
const RevokeAndPublishAddress = RevokeAndPublishArtifact.networks[1].address

let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8555'))
web3.eth = promisifyAll(web3.eth)


const claimKey = 'muPortDocumentIPFS1220'

class EthereumUtils {

  static async createPublishTxParams (ipfsHash, managementAddress) {
    const encodedHash = encodeIpfsHash(ipfsHash)
    const data = encodeMethodCall('publish', [managementAddress, claimKey, encodedHash])
    //const data = encodeMethodCall('publish', [managementAddress, '0x22', '0x11'])
    const nonce = await web3.eth.getTransactionCountAsync()
    const gasPrice = (await web3.eth.getGasPriceAsync()).toNumber()
    const txParams = {
      nonce,
      gasPrice,
      to: RevokeAndPublishAddress,
      data,
    }
    txParams.gasLimit = await web3.eth.estimateGasAsync({...txParams, from: managementAddress})
    return txParams
  }

  static calculateTxCost (txParams) {
    return web3.fromWei(txParams.gasPrice * txParams.gasLimit, 'ether')
  }

  static async sendRawTx (rawTx) {
    await web3.eth.sendRawTransactionAsync(rawTx)
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
