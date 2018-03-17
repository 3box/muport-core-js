const assert = require('chai').assert
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
const MuPort = require('../muport')

let id1
let id2
let id3
let id4
let recoveredId4

describe('MuPort', () => {

  it('create an identity correctly', async () => {
    id1 = await MuPort.newIdentity('lala')
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



})
