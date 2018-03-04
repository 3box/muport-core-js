const IPFS = require('ipfs-mini')
const promisifyAll = require('bluebird').promisifyAll
const resolve = require('did-resolver')
const registerMuportResolver = require('muport-did-resolver')
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

  serializeState () {
    return {
      did: this.did,
      document: this.document,
      keyring: this.keyring.serialize()
    }
  }

  static async createIdentity (name, delegateDids) {
    const publicProfile = { name }
    const keyring = new Keyring()
    let recoveryNetwork
    if (delegateDids) {
      const didsPublicKeys = await Promise.all(delegateDids.map(async did => (await resolve(did)).asymEncryptionKey))
      recoveryNetwork = await keyring.createShares(delegateDids, didsPublicKeys)
    }
    const publicKeys = keyring.getPublicKeys()

    const doc = createDidDocument(publicKeys, recoveryNetwork, publicProfile)
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

  static async resolveIdentity (did) {
    return resolve(did)
  }
}

const createDidDocument = (publicKeys, recoveryNetwork, publicProfile) => {
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
  return doc
}

module.exports = MuPort
