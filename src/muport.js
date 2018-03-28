const IPFS = require('ipfs-mini')
const promisifyAll = require('bluebird').promisifyAll
const resolve = require('did-resolver')
const registerMuportResolver = require('muport-did-resolver')
const bs58 = require('bs58')
const Keyring = require('./keyring')
const EthereumUtils = require('./ethereum-utils')

registerMuportResolver()
const IPFS_CONF = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' }
const ipfs = promisifyAll(new IPFS(IPFS_CONF))

class MuPort {

  constructor (opts = {}) {
    if (!opts.did || !opts.document || !opts.keyring) {
      throw new Error('Data missing for restoring identity')
    }
    this.did = opts.did
    this.document = opts.document
    this.documentHash = opts.documentHash || this.did.split(':')[2]
    this.keyring = new Keyring(opts.keyring)

    // TODO - verify integrity of identity (resolving ID should result in the same did document, etc)
  }

  async helpRecover (did) {
    const didDoc = await resolve(did)

    return this.keyring.decryptOneShare(didDoc.recoveryNetwork, didDoc.asymEncryptionKey, this.did)
  }

  getDid() {
    return this.did
  }

  getDidDocument () {
    return this.document
  }

  getRecoveryDelegateDids () {
    const toBuffer = true
    let dids = []
    if (this.document.symEncryptedData.symEncDids != undefined){
      dids = this.document.symEncryptedData.symEncDids.map(
        (encDid) => bufferToDid(this.keyring.symDecrypt(encDid.ciphertext, encDid.nonce, toBuffer))
      )
    }
    return dids
  }

  async updateDelegates (delegateDids) {
    if (delegateDids.length !== 3) throw new Error('Must provide exactly 3 DIDs')
    // generate new recoveryNetwork
    const didsPublicKeys = await Promise.all(delegateDids.map(async did => (await resolve(did)).asymEncryptionKey))
    const recoveryNetwork = await this.keyring.createShares(delegateDids, didsPublicKeys)

    this.document.recoveryNetwork = recoveryNetwork
    this.documentHash = await ipfs.addJSONAsync(this.document)

    // TODO - make on-chain tx
    const address = this.keyring.getManagementAddress()
    const txParams = await EthereumUtils.createPublishTxParams(this.documentHash, address)
    console.log(txParams)
    const costInEther = EthereumUtils.calculateTxCost(txParams)
    const signedTx = this.keyring.signManagementTx(txParams)
    console.log(signedTx)

    return {
      address,
      costInEther,
      finishUpdate: async () => {
        await EthereumUtils.sendRawTx(signedTx)
      }
    }
  }

  serializeState () {
    return {
      did: this.did,
      document: this.document,
      documentHash: this.documentHash,
      keyring: this.keyring.serialize()
    }
  }

  static async newIdentity (name, delegateDids) {
    const publicProfile = { name }
    const keyring = new Keyring()
    let recoveryNetwork
    let symEncryptedDelegateDids
    if (delegateDids) {
      const didsPublicKeys = await Promise.all(delegateDids.map(async did => (await resolve(did)).asymEncryptionKey))
      recoveryNetwork = await keyring.createShares(delegateDids, didsPublicKeys)

      symEncryptedDelegateDids = delegateDids.map((did) => keyring.symEncrypt(didToBuffer(did)))

    }
    const publicKeys = keyring.getPublicKeys()

    const doc = createDidDocument(publicKeys, recoveryNetwork, publicProfile, {symEncDids: symEncryptedDelegateDids})
    const docHash = await ipfs.addJSONAsync(doc)
    const did = 'did:muport:' + docHash

    return new MuPort({
      did,
      document: doc,
      documentHash: docHash,
      keyring: keyring.serialize()
    })
  }

  static async recoverIdentity (did, shares) {
    return new MuPort({
      did,
      document: await resolve(did),
      keyring: (await Keyring.recoverKeyring(shares)).serialize()
    })
  }

  static async resolveIdentityDocument (did) {
    return resolve(did)
  }
}

const createDidDocument = (publicKeys, recoveryNetwork, publicProfile, symEncryptedData) => {
  // TODO - this is not a real did document
  let doc = {
    version: 1,
    ...publicKeys
  }
  if (recoveryNetwork) {
    doc.recoveryNetwork = recoveryNetwork
  }
  if (publicProfile) {
    doc.publicProfile = publicProfile
  }
  if (symEncryptedData) {
    doc.symEncryptedData = symEncryptedData
  }
  return doc
}

const bufferToDid = (didBuffer) => {
  return ('did:muport:' + bs58.encode(didBuffer))
}

const didToBuffer = (didUri) => {
  const hash = didUri.split(':')[2]
  return bs58.decode(hash)
}

module.exports = MuPort
