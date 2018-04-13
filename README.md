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

<a name="MuPort"></a>

### MuPort
Primary object for interacting with a µPort identity. MuPort enables creation and
updating of µPort identities. It also provides functionality to sign claims and
help other identities recover.

**Kind**: global class  

* [MuPort](#MuPort)
    * [new MuPort(serializeState, [opts])](#new_MuPort_new)
    * _instance_
        * [.helpRecover(did)](#MuPort+helpRecover) ⇒ <code>Promise.&lt;String, Error&gt;</code>
        * [.getDid()](#MuPort+getDid) ⇒ <code>String</code>
        * [.getDidDocument()](#MuPort+getDidDocument) ⇒ <code>Object</code>
        * [.getRecoveryDelegateDids()](#MuPort+getRecoveryDelegateDids) ⇒ <code>Array.&lt;String&gt;</code>
        * [.updateDelegates(delegateDids)](#MuPort+updateDelegates) ⇒
        * [.signJWT()](#MuPort+signJWT) ⇒ <code>Promise.&lt;String, Error&gt;</code>
        * [.verifyJWT(jwt, audience)](#MuPort+verifyJWT) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
        * [.serializeState()](#MuPort+serializeState) ⇒ <code>String</code>
    * _static_
        * [.newIdentity(name, delegateDids, [opts])](#MuPort.newIdentity) ⇒ <code>Promise.&lt;MuPort, Error&gt;</code>
        * [.recoverIdentity(did, shares, [opts])](#MuPort.recoverIdentity) ⇒ <code>Promise.&lt;MuPort, Error&gt;</code>
        * [.resolveIdentityDocument(did, [opts])](#MuPort.resolveIdentityDocument) ⇒ <code>Promise.&lt;Object, Error&gt;</code>

<a name="new_MuPort_new"></a>

#### new MuPort(serializeState, [opts])
Instantiates a µPort identity from its serialized state.


| Param | Type | Description |
| --- | --- | --- |
| serializeState | <code>String</code> | the serialized state of a µPort identity |
| [opts] | <code>Object</code> | optional parameters |
| opts.ipfsConf | <code>Object</code> | configuration options for ipfs-mini |
| opts.rpcProviderUrl | <code>String</code> | rpc url to a custom ethereum node |

<a name="MuPort+helpRecover"></a>

#### muPort.helpRecover(did) ⇒ <code>Promise.&lt;String, Error&gt;</code>
Help another identity recover. Returns a decrypted share if the current identity is a delegate
returns undefined otherwise

**Kind**: instance method of [<code>MuPort</code>](#MuPort)  
**Returns**: <code>Promise.&lt;String, Error&gt;</code> - a share that the recovering identity can use  

| Param | Type | Description |
| --- | --- | --- |
| did | <code>String</code> | the did of the identity that should be recovered |

<a name="MuPort+getDid"></a>

#### muPort.getDid() ⇒ <code>String</code>
The DID is the identifier of the identity. This is a unique string that can be used to
look up information about the identity.

**Kind**: instance method of [<code>MuPort</code>](#MuPort)  
**Returns**: <code>String</code> - the DID  
<a name="MuPort+getDidDocument"></a>

#### muPort.getDidDocument() ⇒ <code>Object</code>
The DID Document is a json object that contains information such as public keys

**Kind**: instance method of [<code>MuPort</code>](#MuPort)  
**Returns**: <code>Object</code> - the DID Document  
<a name="MuPort+getRecoveryDelegateDids"></a>

#### muPort.getRecoveryDelegateDids() ⇒ <code>Array.&lt;String&gt;</code>
The recovery delegates that can help this identity recover

**Kind**: instance method of [<code>MuPort</code>](#MuPort)  
**Returns**: <code>Array.&lt;String&gt;</code> - an array containing the DIDs of the delegates  
<a name="MuPort+updateDelegates"></a>

#### muPort.updateDelegates(delegateDids) ⇒
This function is used to update the recoveryNetwork of the identity. The returned object
has three properties; `address` an ethereum address, `costInEther` a number, and
`finishUpdate` a function.
In order to complete the update of the delegates you have to
send `costInEther` ether to the `address` on mainnet (or other network if you are using
a custom config). Once that is done the `finishUpdate` function can be called. This
function sends a transaction to the network that updates the identity. The function
will throw an error if there is to little ether in the `address`.

**Kind**: instance method of [<code>MuPort</code>](#MuPort)  
**Returns**: {Promise<Object, Error>             an object with the data needed to finalize the update  

| Param | Type | Description |
| --- | --- | --- |
| delegateDids | <code>Array.&lt;String&gt;</code> | an array containing the 3 DIDs of the new delegates |

<a name="MuPort+signJWT"></a>

#### muPort.signJWT() ⇒ <code>Promise.&lt;String, Error&gt;</code>
Signs the given payload (claim) and return a promis with the JWT.

**Kind**: instance method of [<code>MuPort</code>](#MuPort)  
**Returns**: <code>Promise.&lt;String, Error&gt;</code> - a promise that resolves to a JWT  
<a name="MuPort+verifyJWT"></a>

#### muPort.verifyJWT(jwt, audience) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Verifies a JWT.

**Kind**: instance method of [<code>MuPort</code>](#MuPort)  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - a promise that resolves to the decoded JWT  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| jwt | <code>String</code> |  | the JWT to verify |
| audience | <code>String</code> | <code>this.did</code> | the audience, defaults to did of current identity |

<a name="MuPort+serializeState"></a>

#### muPort.serializeState() ⇒ <code>String</code>
Serialize the state of the current identity to be able to reconstruct it later.

**Kind**: instance method of [<code>MuPort</code>](#MuPort)  
**Returns**: <code>String</code> - the serialized state  
<a name="MuPort.newIdentity"></a>

#### MuPort.newIdentity(name, delegateDids, [opts]) ⇒ <code>Promise.&lt;MuPort, Error&gt;</code>
Creates a new µPort identity.

**Kind**: static method of [<code>MuPort</code>](#MuPort)  
**Returns**: <code>Promise.&lt;MuPort, Error&gt;</code> - a promise that resolves to an instance of the MuPort class  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | a name for the new identity |
| delegateDids | <code>Array.&lt;String&gt;</code> | three DIDs that can be used to recover the identity at a later point (optional) |
| [opts] | <code>Object</code> | optional parameters |
| opts.ipfsConf | <code>Object</code> | configuration options for ipfs-mini |
| opts.rpcProviderUrl | <code>String</code> | rpc url to a custom ethereum node |

<a name="MuPort.recoverIdentity"></a>

#### MuPort.recoverIdentity(did, shares, [opts]) ⇒ <code>Promise.&lt;MuPort, Error&gt;</code>
Recovers a µPort identity.

**Kind**: static method of [<code>MuPort</code>](#MuPort)  
**Returns**: <code>Promise.&lt;MuPort, Error&gt;</code> - a promise that resolves to an instance of the MuPort class  

| Param | Type | Description |
| --- | --- | --- |
| did | <code>String</code> | the DID of the identity to be recovered |
| shares | <code>Array.&lt;String&gt;</code> | atleast two shares that your delegates helped recover |
| [opts] | <code>Object</code> | optional parameters |
| opts.ipfsConf | <code>Object</code> | configuration options for ipfs-mini |
| opts.rpcProviderUrl | <code>String</code> | rpc url to a custom ethereum node |

<a name="MuPort.resolveIdentityDocument"></a>

#### MuPort.resolveIdentityDocument(did, [opts]) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Resovles the identity document for the given DID.

**Kind**: static method of [<code>MuPort</code>](#MuPort)  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - a promise that resolves to the identity document  

| Param | Type | Description |
| --- | --- | --- |
| did | <code>String</code> | the DID of the identity |
| [opts] | <code>Object</code> | optional parameters |
| opts.ipfsConf | <code>Object</code> | configuration options for ipfs-mini |
| opts.rpcProviderUrl | <code>String</code> | rpc url to a custom ethereum node |

