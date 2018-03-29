const assert = require('chai').assert
const ganache = require('ganache-cli')
const bs58 = require('bs58')
const EthereumClaimsRegistryAbi = require('ethereum-claims-registry').registry.abi
const Web3 = require('web3')
const promisifyAll = require('bluebird').promisifyAll
let IPFS = require('ipfs-mini')
IPFS.prototype.catJSON = (hash, cb) => {
  let doc
  switch (hash) {
    case 'QmZZBBKPS2NWc6PMZbUk9zUHCo1SHKzQPPX4ndfwaYzmP1':
      doc = id1.getDidDocument()
      break
    case 'QmZZBBKPS2NWc6PMZbUk9zUHCo1SHKzQPPX4ndfwaYzmP2':
      doc = id2.getDidDocument()
      break
    case 'QmZZBBKPS2NWc6PMZbUk9zUHCo1SHKzQPPX4ndfwaYzmP3':
      doc = id3.getDidDocument()
      break
    case 'QmZZBBKPS2NWc6PMZbUk9zUHCo1SHKzQPPX4ndfwaYzmP4':
      doc = id4.getDidDocument()
      break
  }
  cb(null, doc)
}
let num = 1
IPFS.prototype.addJSON = (json, cb) => {
  // fake ipfs hash
  cb(null, 'QmZZBBKPS2NWc6PMZbUk9zUHCo1SHKzQPPX4ndfwaYzmP' + num++)
}
const RPC_PROV_URL = 'http://localhost:8555'
const deployData = require('./deployData.json')
const MuPort = require('../muport')
let id1
let id2
let id3
let id4

describe('MuPort', () => {

  let recoveredId4
  let server
  let web3
  let accounts
  let claimsReg

  beforeAll(async () => {
    server = promisifyAll(ganache.server({unlocked_accounts: [0]}))
    await server.listenAsync(8555)
    web3 = new Web3(server.provider)
    web3.eth = promisifyAll(web3.eth)
    accounts = await web3.eth.getAccountsAsync()
    await deploy(deployData.EthereumClaimsRegistry)
    await deploy(deployData.RevokeAndPublish)
    const EthereumClaimsRegistry = web3.eth.contract(EthereumClaimsRegistryAbi)
    claimsReg = promisifyAll(EthereumClaimsRegistry.at(deployData.EthereumClaimsRegistry.contractAddress))
  })

  it('create an identity correctly', async () => {
    id1 = await MuPort.newIdentity('lala', null, {rpcProviderUrl: RPC_PROV_URL})
    const serialized = id1.serializeState()

    const tmpId = new MuPort(serialized)
    assert.deepEqual(tmpId.serializeState(), serialized)
  })

  it('recover identity correctly', async () => {
    id2 = await MuPort.newIdentity('id2')
    id3 = await MuPort.newIdentity('id3')
    // get dids from three identities and pass them along the identity creation process
    id4 = await MuPort.newIdentity('id4', [id1.getDid(), id2.getDid(), id3.getDid()])

    const didOfLostId = id4.getDid()
    const share2 = await id2.helpRecover(didOfLostId)
    const share3 = await id3.helpRecover(didOfLostId)
    recoveredId4 = await MuPort.recoverIdentity(didOfLostId, [share2, share3])

    assert.deepEqual(recoveredId4.serializeState(), id4.serializeState())
  })

  it('returns the delegate DIDs correctly', async () => {
    const dids = id4.getRecoveryDelegateDids()
    assert.deepEqual(dids, [id1.getDid(), id2.getDid(), id3.getDid()])

    const didsFromRecovered = recoveredId4.getRecoveryDelegateDids()
    assert.deepEqual(didsFromRecovered, [id1.getDid(), id2.getDid(), id3.getDid()])
  })

  it('returns an empty list of delegate DIDs', async () => {
    const dids = id1.getRecoveryDelegateDids()
    assert.equal(dids.length, 0)

    const didsFromRecovered = recoveredId4.getRecoveryDelegateDids()
    assert.deepEqual(didsFromRecovered, [id1.getDid(), id2.getDid(), id3.getDid()])
  })

  it('updateDelegates works as intended', async () => {
    const updateData = await id1.updateDelegates([id2.getDid(), id3.getDid(), id4.getDid()])

    let threwError = false
    try {
      await updateData.finishUpdate()
    } catch (e) {
      threwError = true
    }
    assert.isTrue(threwError, 'finishUpdate should throw if no funds in managementAddress')
    await web3.eth.sendTransactionAsync({from: accounts[0], to: updateData.address, value: web3.toWei(updateData.costInEther, 'ether')})
    await updateData.finishUpdate()

    let entry = await claimsReg.registryAsync(deployData.RevokeAndPublish.contractAddress, updateData.address, 'muPortDocumentIPFS1220')
    let hash = bs58.encode(Buffer.from('1220' + entry.slice(2), 'hex'))
    assert.equal(hash, id1.documentHash, 'hash in registry should be the same as in muport ID')
  })

  it('updateDelegates second time works as intended', async () => {
    const updateData = await id1.updateDelegates([id4.getDid(), id2.getDid(), id3.getDid()])

    await web3.eth.sendTransactionAsync({from: accounts[0], to: updateData.address, value: web3.toWei(updateData.costInEther, 'ether')})
    await updateData.finishUpdate()

    let entry = await claimsReg.registryAsync(deployData.RevokeAndPublish.contractAddress, updateData.address, 'muPortDocumentIPFS1220')
    let hash = bs58.encode(Buffer.from('1220' + entry.slice(2), 'hex'))
    assert.equal(hash, id1.documentHash, 'hash in registry should be the same as in muport ID')
  })

  afterAll(() => {
    server.close()
  })

  const deploy = async deployData => {
    await web3.eth.sendTransactionAsync({from: accounts[0], to: deployData.senderAddress, value: web3.toWei(deployData.costInEther, 'ether')})
    let txHash = await web3.eth.sendRawTransactionAsync(deployData.rawTx)
    let receipt = await web3.eth.getTransactionReceiptAsync(txHash)
  }
})
