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

#### serializeState ()
Returns an object containing the serialized state. Note that this includes information about the private keys.

#### static async newIdentity (name, delegates)
This function creates a new identity with the given name and creates a recovery network using the given delegates. The `delegates` variable needs to be an array of did strings. The function returns an instance of MuPort. This function can also be called without delegates to create an identity without a recovery network.

#### static async recoverIdentity (did, shares)
This function returns an instance of MuPort for the recovered identity. The did parameter has to be the did of the identity being recovered and shares needs to be an array of atleast two decrypted shares.

#### static async resolveIdentityDocument (did)
This function returns the DID document of the given DID.
