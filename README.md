# BitVote-Multichain-Voting-System

BitVote is a multi‑chain voting protocol that synchronizes election data across **Ethereum Sepolia**, **Arbitrum Sepolia**, and **Base Sepolia**.  
Powered by **Chainlink CRE (Cross-Chain Runtime Environment) workflows**, it mirrors campaigns and votes across all networks, ensuring a unified, secure, and seamless environment for decentralized governance.

---

##  Protocol Architecture

BitVote is structured into **three architectural layers**:

### 1. **Application Layer**
- Provides a unified HTTP interface for voters, organizers, and administrators.  
- Abstracts away the complexity of interacting with multiple chains.  
- Handles requests for voting, registration, and campaign creation.

### 2. **Workflow Layer (Chainlink CRE)**
- Executes **cross-chain workflows** that propagate actions across all supported networks.  
- Guarantees **atomicity**: a vote or campaign creation either succeeds everywhere or fails gracefully.  
- Provides monitoring and execution status feedback for transparency.

### 3. **Smart Contract Layer (BitVote Core Contracts)**
- Deployed independently on Ethereum Sepolia, Arbitrum Sepolia, and Base Sepolia.  
- Each contract instance maintains local state but is continuously synchronized via CRE workflows.  
- Contracts enforce rules for voter eligibility, campaign validity, and vote tallying.

---

##  Workflows

BitVote defines **three primary workflows**, each mapped to a governance function:

### 1. **BitVote Workflow (Casting Votes Globally)**  
- **Purpose:** Allows voters to cast a single vote that is mirrored across all supported chains.  
- **Execution Steps:**  
  1. User submits a vote via HTTP trigger.  
  2. CRE workflow validates voter eligibility.  
  3. Vote is propagated to all BitVote Core contracts.  
  4. Confirmation is returned once all chains acknowledge the vote.  
- **Key Features:**  
  - Prevents double voting.  
  - Ensures global consistency.  
  - Provides audit logs for transparency.
    
<img width="1344" height="529" alt="vote" src="https://github.com/user-attachments/assets/d12c912e-70f3-4778-912f-597e4d4f89ad" />

---

### 2. **Register Workflow (Voter Registration)**  
- **Purpose:** Registers voters into the BitVote protocol, enabling participation in campaigns.  
- **Execution Steps:**  
  1. User submits registration request via HTTP trigger.  
  2. CRE workflow validates identity and eligibility.  
  3. Voter record is written to all BitVote Core contracts.  
  4. Confirmation is returned once synchronization is complete.  
- **Key Features:**  
  - Unified voter registry across chains.  
  - Prevents duplicate registrations.  
  - Ensures voter eligibility checks are consistent globally.  

<img width="1342" height="529" alt="registerVoter" src="https://github.com/user-attachments/assets/b429fe96-d35c-4562-a7b8-d9f9854a5e24" />


---

### 3. **CreateCampaign Workflow (Campaign Creation)**  
- **Purpose:** Enables organizers to create campaigns that voters can participate in.  
- **Execution Steps:**  
  1. Organizer submits campaign details via HTTP trigger.  
  2. CRE workflow validates campaign parameters (duration, eligibility, etc.).  
  3. Campaign is propagated to all BitVote Core contracts.  
  4. Confirmation is returned once campaigns are globally visible.  
- **Key Features:**  
  - Campaigns are synchronized across all supported chains.  
  - Prevents fragmentation of governance processes.  
  - Provides transparency and auditability for organizers.  

<img width="1343" height="527" alt="createCampaign" src="https://github.com/user-attachments/assets/47a4a8c7-82ad-4e94-bcf7-a91a8f6dc5bb" />


---

##  Utility of BitVote

- **Decentralized Governance:** Transparent, tamper-proof voting across multiple chains.  
- **Cross-Chain Synchronization:** Eliminates fragmentation by mirroring campaigns and votes globally.  
- **Scalability:** Supports multiple chains without requiring separate user actions.  
- **Security:** Chainlink CRE ensures reliable execution and data integrity.  
- **Simplicity:** One HTTP trigger for all workflows, making participation seamless.  
- **Auditability:** Each workflow provides execution logs and status confirmations.  

---

##  Future Extensions

- Support for additional chains beyond Sepolia testnets.  
- Integration with decentralized identity verification systems.  
- Advanced analytics dashboards for campaign organizers.  
- DAO governance modules for community-driven projects.  
- Layered access control for administrators and auditors.  

---

##  Summary

BitVote leverages **Chainlink CRE workflows** and **multichain smart contracts** to deliver a **global, synchronized, and secure voting system**.  
With workflows for **casting votes**, **registering voters**, and **creating campaigns**, it ensures decentralized governance is accessible and reliable across multiple blockchain networks.
