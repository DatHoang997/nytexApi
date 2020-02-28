const Events = [
  {
    code: "0x0427b353dc7214e3d8c7f5039475a8e729f4d62922937381e304cd03becf66d2",
    event: "Absorption(int256, uint256, bool)",
    inputs: [{
      type: 'int256',
      name: 'amount'
    },{
      type: 'uint256',
      name: 'supply',
    },{
      type: 'bool',
      name: 'emptive',
    }]
  },
  {
    code: "0xce51ffa16246bcaf0899f6504f473cd0114f430f566cef71ab7e03d3dde42a41",
    event: "NewCheckpointVote(uint64, bytes32, uint8, bytes32, bytes32)",
    inputs: [{
      type: 'uint64',
      name: 'amount',
      indexed : true
    },{
      type: 'bytes32',
      name: 'checkpointHash',
    },{
      type: 'uint8',
      name: 'v',
    },{
      type: 'bytes32',
      name: 'r',
    },{
      type: 'bytes32',
      name: 's',
    }]
  },
  {
    code: "0xbedf0f4abfe86d4ffad593d9607fe70e83ea706033d44d24b3b6283cf3fc4f6b",
    event: "Stop()",
    inputs: [{}]
  },
  {
    code: "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
    event: "Approval(address, address, uint256)",
    inputs: [{
      type: 'address',
      name: 'owner',
      indexed : true
    },{
      type: 'address',
      name: 'spender',
      indexed : true
    },{
      type: 'uint256',
      name: 'value',
    }]
  },
  {
    code: "0x9f77920c3de8baaa98d273e8aa75fae382aaa9f7f60f38979137853e5b73ea2c",
    event: "Revoke(address)",
    inputs: [{
      type: 'address',
      name: 'maker',
      indexed : true
    }]
  },
  {
    code: "0x56e25d1b63c01627fcd54936462c97aeb9a18352bf0ed161e8141a33cfd795ca",
    event: "Propose(address, int256, uint256, uint256, uint256)",
    inputs: [{
      type: 'address',
      name: 'maker',
      indexed : true
    },{
      type: 'int256',
      name: 'amount',
    },{
      type: 'uint256',
      name: 'stake',
    },{
      type: 'uint256',
      name: 'lockdownExpiration',
    },{
      type: 'uint256',
      name: 'slashingRate',
    }]  },
  {
    code: "0x8427e4488966b7bd3193a4617993e5e6b9186f0c4b2c303cc6178f4e33b77d08",
    event: "Preemptive(address, uint256, uint256, uint256)",
    inputs: [{
      type: 'address',
      name: 'maker',
      indexed : true
    },{
      type: 'uint256',
      name: 'stake',
    },{
      type: 'uint256',
      name: 'lockdownExpiration',
    },{
      type: 'uint256',
      name: 'unlockNumber'
    }]  
  },
  {
    code: "0xa69f22d963cb7981f842db8c1aafcc93d915ba2a95dcf26dcc333a9c2a09be26",
    event: "Slash(address, uint256)",
    inputs: [{
      type: 'address',
      name: 'maker',
      indexed : true
    },{
      type: 'uint256',
      name: 'amount',
    }]  
  },
  {
    code: "0x0be774851955c26a1d6a32b13b020663a069006b4a3b643ff0b809d318260572",
    event: "Unlock(address)",
    inputs: [{
      type: 'address',
      name: 'maker',
      indexed : true
    }]  
  },
  {
    code: "0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0",
    event: "OwnershipTransferred(address, address)",
    inputs: [{
      type: 'address',
      name: 'previousOwner',
      indexed : true
    },{
      type: 'address',
      name: 'newOwner',
      indexed : true
    }]
  },
  {
    code: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    event: "Transfer(address, address, uint256)",
    inputs: [{
      type: 'address',
      name: 'from',
      indexed : true
    },{
      type: 'address',
      name: 'to',
      indexed : true
    },{
      type: 'uint256',
      name: 'value',
    }]   
  },
  {
    code: "0xe19260aff97b920c7df27010903aeb9c8d2be5d310a2c67824cf3f15396e4c16",
    event: "Transfer(address, address, uint256)",
    inputs: [{
      type: 'address',
      name: 'from',
      indexed : true
    },{
      type: 'address',
      name: 'to',
      indexed : true
    },{
      type: 'uint256',
      name: 'value',
    }]  
  },
  {
    code: "0x0be774851955c26a1d6a32b13b020663a069006b4a3b643ff0b809d318260572",
    event: "Unlock(address)",
    inputs: [{
      type: 'address',
      name: 'maker',
      indexed : true
    }]  
  },
];

module.exports = Events;
