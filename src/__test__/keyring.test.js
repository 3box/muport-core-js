const assert = require('chai').assert
const Keyring = require('../keyring')
const bip39 = require('bip39')
const nacl = require('tweetnacl')
nacl.util = require('tweetnacl-util')

// These are just random ipfs hashes
const DIDS = [
  'did:muport:QmZZBBKPS2NWc6PMZbUk9zUHCo1SHKzQPPX4ndfwaYzmPW',
  'did:muport:QmWfn55PTKTwCbdiEKgqdYXdJuHn25y6z7vwoV7QKLddVY',
  'did:muport:Qmbd63DgTfEH2xkLKfpVJovdqwZyZmrAkiEKV4do3nEPSU'
]

describe('Keyring', () => {

  let keyring1
  const mnemonic = 'clay rubber drama brush salute cream nerve wear stuff sentence trade conduct'
  const publicKeys = {
    signingKey: '028aaa695fa16f2a2279e1de718d80e00f4f4ddf30fe8674bbdb9e1f11778c2f77',
    managementKey: '0291888f1c8cff90aea41cf97dc9b015f2185983524a5e6df888401565239d4d8a',
    asymEncryptionKey: 'wW1wkjQ7kaZiBvk4bhukQ15Idx6d31XKFpq/jeup5nc='
  }
  const signedData = {
    r: 'b1f9c552e21b40fe95c5d3074a4ef3948a092a77fc814781bf8ae3a263499e0a',
    s: 'a57bdeb64a1490c3e8877d2d6e0c0450a87b765d8bf6f541b65bbf3aac1926f2',
    recoveryParam: 1
  }
  const keyring2 = new Keyring()
  const keyring3 = new Keyring()

  it('derives correct keys from mnemonic', async () => {
    keyring1 = new Keyring({mnemonic})

    assert.deepEqual(keyring1.getPublicKeys(), publicKeys)
    assert.deepEqual(keyring1.serialize().mnemonic, mnemonic)
    assert.deepEqual((await keyring1.getJWTSigner()('asdf')), signedData)
  })

  it('encrypts and decrypts correctly', () => {
    const testMsg = "Very secret test message"
    let box = keyring1.encrypt(testMsg, keyring2.getPublicKeys().asymEncryptionKey)

    let cleartext = keyring2.decrypt(box.ciphertext, keyring1.getPublicKeys().asymEncryptionKey, box.nonce)
    assert.equal(cleartext, testMsg)
  })

  it('splits shares correctly', async () => {
    delegatePubKeys = [
      keyring1.getPublicKeys().asymEncryptionKey,
      keyring2.getPublicKeys().asymEncryptionKey,
      keyring3.getPublicKeys().asymEncryptionKey
    ]
    const recoveryNetwork = await keyring1.createShares(DIDS, delegatePubKeys)
    const share2 = keyring2.decryptOneShare(recoveryNetwork, delegatePubKeys[0], DIDS[1])
    const share3 = keyring3.decryptOneShare(recoveryNetwork, delegatePubKeys[0], DIDS[2])

    const recoveredKeyring = await Keyring.recoverKeyring([share2, share3])
    assert.deepEqual(recoveredKeyring.getPublicKeys(), publicKeys)
  })

  it('symmetrically encrypts correctly', async () => {
    const testMsg = "Very secret test message"
    let box = keyring2.symEncrypt(testMsg)
    let cleartext = keyring2.symDecrypt(box.ciphertext, box.nonce)
    assert.equal(cleartext, testMsg)
  })

  it('returns the correct management address', () => {
    const managementAddress = '0xC94629D67851E1CA43961c3B17964Db3e0b02FFB'
    const address = keyring1.getManagementAddress()
    assert.equal(address, managementAddress)
  })

  it('signs management tx correctly', () => {
    const signedRawTx = '0xf889808609184e72a00082271094000000000000000000000000000000000000000080a47f74657374320000000000000000000000000000000000000000000000000000006000571ba0da757d67e406f5846b4edb2b8ae3449141251ebcf12521165f4a04c18ca41395a00c2864ec3bd0c7e8388708caf019a855561c66a148f3928732f454ab59b1b71c'
    const params = {
      nonce: '0x00',
      gasPrice: '0x09184e72a000',
      gasLimit: '0x2710',
      to: '0x0000000000000000000000000000000000000000',
      value: '0x00',
      data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
    }
    const rawTx = keyring1.signManagementTx(params)
    assert.equal(rawTx, signedRawTx)
  })
})
