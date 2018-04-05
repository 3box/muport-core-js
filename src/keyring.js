const bip39 = require('bip39')
const hdkey = require('ethereumjs-wallet/hdkey')
const Tx = require('ethereumjs-tx')
const nacl = require('tweetnacl')
nacl.util = require('tweetnacl-util')
const bs58 = require('bs58')
const sss = require('secrets.js')

const BASE_PATH = "m/7696500'/0'/0'"


class Keyring {

  constructor (opts = {}) {
    const mnemonic = opts.mnemonic || bip39.generateMnemonic()
    this._initKeysFromMnemonic(mnemonic)
  }

  async createShares (dids, publicKeys) {
    const amount = 3
    const theshold = 2
    if (dids.length !== amount && publicKeys.length !== amount) {
      throw new Error('There needs to be exactly ' + amount + ' dids and corresponding publicKeys')
    }
    const entropyStr = bip39.mnemonicToEntropy(this.mnemonic).toString('hex')
    const shares = await sss.share(entropyStr, amount, theshold)
    const nonce = randomNonce()
    // we need to add 0 to the end of the shares because they are of odd length
    return {
      nonce: nacl.util.encodeBase64(nonce),
      ciphertexts: [
        this.encrypt(Buffer.concat([didToBuffer(dids[0]), Buffer.from(shares[0]+'0', 'hex')]), publicKeys[0], nonce).ciphertext,
        this.encrypt(Buffer.concat([didToBuffer(dids[1]), Buffer.from(shares[1]+'0', 'hex')]), publicKeys[1], nonce).ciphertext,
        this.encrypt(Buffer.concat([didToBuffer(dids[2]), Buffer.from(shares[2]+'0', 'hex')]), publicKeys[2], nonce).ciphertext
      ]
    }
  }

  encrypt (msg, toPublic, nonce) {
    nonce = nonce || randomNonce()
    toPublic = nacl.util.decodeBase64(toPublic)
    if (typeof msg === 'string') {
      msg = nacl.util.decodeUTF8(msg)
    }
    const ciphertext = nacl.box(msg, nonce, toPublic, this.asymEncryptionKey.secretKey)

    return {
      nonce: nacl.util.encodeBase64(nonce),
      ciphertext: nacl.util.encodeBase64(ciphertext)
    }
  }

  decrypt (ciphertext, fromPublic, nonce, toBuffer) {
    fromPublic = nacl.util.decodeBase64(fromPublic)
    ciphertext = nacl.util.decodeBase64(ciphertext)
    nonce = nacl.util.decodeBase64(nonce)

    const cleartext = nacl.box.open(ciphertext, nonce, fromPublic, this.asymEncryptionKey.secretKey)
    if (toBuffer) {
      return cleartext ? Buffer.from(cleartext) : null
    }
    return cleartext ? nacl.util.encodeUTF8(cleartext) : null
  }

  decryptOneShare (recoveryNetwork, fromPublic, did) {
    const didBuf = didToBuffer(did)
    for (const box of recoveryNetwork.ciphertexts) {
      const cleartextBuf = this.decrypt(box, fromPublic, recoveryNetwork.nonce, true)
      // where we able to decrypt?
      // check if encrypted did is our did
      if (cleartextBuf && didBuf.equals(cleartextBuf.slice(0, didBuf.length))) {
        // return the decrypted share, remove the trailing zero
        return cleartextBuf.slice(didBuf.length, cleartextBuf.length + 1).toString('hex').slice(0, -1)
      }
    }
  }

  symEncrypt (msg, nonce) {
    return symEncryptBase(msg, this.symEncryptionKey, nonce)
  }

  symDecrypt (ciphertext, nonce, toBuffer) {
    return symDecryptBase(ciphertext, this.symEncryptionKey, nonce, toBuffer)
  }

  signManagementTx (txParams) {
    const privKey = this.managementKey.getWallet().getPrivateKey()
    let tx = new Tx(txParams)
    tx.sign(privKey)
    return '0x' + tx.serialize().toString('hex')
  }

  getManagementAddress () {
    return this.managementKey.getWallet().getChecksumAddressString()
  }

  getPublicKeys () {
    return {
      signingKey: this.signingKey._hdkey._publicKey.toString('hex'),
      managementKey: this.managementKey._hdkey._publicKey.toString('hex'),
      asymEncryptionKey: nacl.util.encodeBase64(this.asymEncryptionKey.publicKey)
    }
  }

  serialize () {
    return { mnemonic: this.mnemonic }
  }

  _initKeysFromMnemonic(mnemonic) {
    this.mnemonic = mnemonic
    const seed = bip39.mnemonicToSeed(mnemonic)
    this.baseKey = hdkey.fromMasterSeed(seed).derivePath(BASE_PATH)
    this.signingKey = this.baseKey.deriveChild(0)
    this.managementKey = this.baseKey.deriveChild(1)
    const tmpEncKey = this.baseKey.deriveChild(2)._hdkey._privateKey
    this.asymEncryptionKey = nacl.box.keyPair.fromSecretKey(tmpEncKey)
    this.symEncryptionKey = this.baseKey.deriveChild(3)._hdkey._privateKey
  }

  static async recoverKeyring (shares) {
    const entropy = await sss.combine(shares)
    return new Keyring({
      mnemonic: bip39.entropyToMnemonic(entropy)
    })
  }
}

const randomNonce = () => {
  return nacl.randomBytes(24)
}

const didToBuffer = (didUri) => {
  const hash = didUri.split(':')[2]
  return bs58.decode(hash)
}

const symEncryptBase = (msg, symKey, nonce) => {
  nonce = nonce || randomNonce()
  if (typeof msg === 'string') {
    msg = nacl.util.decodeUTF8(msg)
  }

  const ciphertext = nacl.secretbox(msg, nonce, symKey)

  return {
    nonce: nacl.util.encodeBase64(nonce),
    ciphertext: nacl.util.encodeBase64(ciphertext)
  }
}

const symDecryptBase = (ciphertext, symKey, nonce, toBuffer) => {
  ciphertext = nacl.util.decodeBase64(ciphertext)
  nonce = nacl.util.decodeBase64(nonce)

  const cleartext = nacl.secretbox.open(ciphertext, nonce, symKey)
  if (toBuffer) {
    return cleartext ? Buffer.from(cleartext) : null
  }
  return cleartext ? nacl.util.encodeUTF8(cleartext) : null
}


module.exports = Keyring
