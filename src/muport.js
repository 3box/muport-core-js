const IPFS = require('ipfs-mini')
const promisifyAll = require('bluebird').promisifyAll
const resolve = require('did-resolver')
const registerMuportResolver = require('muport-did-resolver')
const bs58 = require('bs58')
const Keyring = require('./keyring')

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
    this.keyring = new Keyring(opts.keyring)
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

  serializeState () {
    return {
      did: this.did,
      document: this.document,
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
    const did = 'did:muport:' + await ipfs.addJSONAsync(doc)

    return new MuPort({
      did,
      document: doc,
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
