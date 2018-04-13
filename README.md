# µPort core

This library is intended to be used to create, update, and recover µPort identities, as well as using the identity to sign and encrypt data.

## Usage
Simply install using npm
```
$ npm install muport-core
```
and then import into your project
```js
const MuPort = require('muport-core')
```

### Functions

#### constructor (serializedStateObject)
The constructor takes an object containing the serialized state and returns an instance of that identity.

#### async helpRecover (did)
Takes a did and returns a decrypted share if the instantiated identity is one of the recovery delegates.

#### getDid ()
Returns the DID of the identity.

#### getDidDocument ()
Returns the DID document of the identity.

#### getRecoveryDelegateDids ()
Returns a list of the DIDs of the recovery delegates.

#### async updateDelegates (delegateDids)
This function is used to update the recoveryNetwork. The `delegates` variable needs to be an array of did strings. Te function returns an object that looks like this:
```
{
  address: <an ethereum address>,
  costInEther: <number>,
  finishUpdate: <function>
}
```

In order to complete the update of the delegates you have to send `costInEther` ether to the `address` on mainnet (or other network if you are using a custom config). Once that is done the `finishUpdate` function can be called. This function sends a transaction to the network that updates the identity. The function will throw an error if there is to little ether in the `address`.

#### async signJWT (payload)
Signs the given payload (claim) and returns a promise with a JWT.

#### async verifyJWT (jwt, audience)
Verifies the given `jwt` and returns a promise that resolves to an object containing the decoded claim etc. `audience` is optional but defaults to the current DID.

#### serializeState ()
Returns an object containing the serialized state. Note that this includes information about the private keys.

#### static async newIdentity (name, delegates)
This function creates a new identity with the given name and creates a recovery network using the given delegates. The `delegates` variable needs to be an array of did strings. The function returns an instance of MuPort. This function can also be called without delegates to create an identity without a recovery network.

#### static async recoverIdentity (did, shares)
This function returns an instance of MuPort for the recovered identity. The did parameter has to be the did of the identity being recovered and shares needs to be an array of atleast two decrypted shares.

#### static async resolveIdentityDocument (did)
This function returns the µPort document of the given DID. If you want to resolve the DID document for an identity please use `muport-did-resolver`
