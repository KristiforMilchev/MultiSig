# Multi-Signature Wallet for Teams and Shared Financial Assets

This Solidity smart contract implements a multi-signature wallet designed to securely manage shared financial assets, particularly for teams or organizations that require collaborative decision-making.
The UI for this is still cooking, so please be patient.


## Key Features

### 1. **Multi-Signature Approval**
   - **Transaction Proposals:** Any owner can propose a transaction to transfer assets (Ether or ERC-20 tokens) from the wallet to a specified address. Each proposal is associated with a unique `nonce`.
   - **Approval Process:** The proposed transaction requires approval from all wallet owners. Each owner can cast their vote for or against the proposal.
   - **Execution:** Once all owners have approved, the transaction is executed automatically, transferring the assets to the intended recipient.

### 2. **Owner Management**
   - **Adding New Owners:** Owners can propose the addition of a new owner. This proposal also requires unanimous approval from the existing owners before the new owner is added to the wallet.
   - **Ownership Integrity:** The contract ensures that a proposed new owner is not already an existing owner, maintaining the integrity of the ownership structure.

### 3. **ERC-20 and Ether Support**
   - The wallet supports both native Ether transactions and ERC-20 token transfers, enabling versatile use in different scenarios.
   - **Token Transfers:** For ERC-20 token transfers, the contract interacts with the token’s standard interface, ensuring smooth transfers following the multi-signature approval process.

### 4. **Price Feed Integration**
   - **USD Conversion:** The contract integrates with an on-chain price feed, allowing it to convert USD amounts to Wei (the smallest unit of Ether). This feature is useful for setting transaction amounts in USD terms.
   - **Balance in USD:** Owners can view the wallet's Ether balance in USD, providing a more accessible way to understand the value held within the wallet.

### 5. **Security**
   - **Only Owner Access:** Functions critical to the wallet's operation are protected by an `onlyOwner` modifier, ensuring that only approved owners can propose or approve transactions and add new owners.
   - **Fallback and Receive Functions:** The contract is equipped with fallback and receive functions to safely accept Ether transfers, maintaining a robust and secure wallet interface.

## Usage

- Deploy the contract with an initial set of owners and a price feed address.
- Owners can propose and approve transactions and manage the list of owners.
- The contract handles Ether and ERC-20 transfers, requiring unanimous owner approval before executing any transactions.

## Testing and the faucet contract

I am aware that these days it's really hard to get enough testnet tokens for those that don't know how to setup their own testnet and because of that i have set up a wallet with enough ETH  for some tests my own testnet. I can regenerate the funds whenever i want, but please as a curtesy
don't drain it and let everyone have a equal share of the ETH pool.

I guess just open a PR if it's empty.
- Private key for the wallet with ETH: 9b03326a56edf91ed670fc2525e4018e7b60aab635cf80460fa4bbb6f70ca2c8

- RPC for connection my personal testnet: https://rpc.blockcert.net
- SYMBOL ETH
- PORT 1337

The chain is a clone of the binance smart chain from few months ago, there is no explorer but there are helper utilities in this repository that will let you scan transactions and check out even logs.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

If you find my work useful and do end up using it, i'd appriate a banana, well monkey see monkey do so...thanks in advance!
0x72c97d752c861842E96D78F485920674CE14053d

This multi-signature wallet contract is designed to facilitate secure, collaborative asset management for teams, organizations, and other entities that require shared financial control.

