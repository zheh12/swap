import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import SwaperEtherArtifact from "../contracts/SwapEther.json";
import swapEtherContractAddress from "../contracts/SwapEther-contract-address.json";
import SwaperErc20Artifact from "../contracts/SwapErc20.json";
import swapErc20ContractAddress from "../contracts/SwapErc20-contract-address.json";
import SwaperErc721Artifact from "../contracts/SwapErc721.json";
import swapErc721ContractAddress from "../contracts/SwapErc721-contract-address.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { SwapContract } from "./swap/SwapContract";
import SwapMessage from "./swap/NewSwap";

// This is the default id used by the Hardhat Network
const HARDHAT_NETWORK_ID = '31337';

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers and the Token contract
//   3. Polls the user balance to keep it suted.
//   4. Transfers tokens by sending transactions
//   5. Renders the whole application
//
// Note that (3) and (4) are specific of this sample application, but they show
// you how to keep your Dapp and contract's state in sync,  and how to send a
// transaction.
export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You don't need to follow this pattern, but it's an useful example.
    this.initialState = {
      // The user's address and balance
      selectedAddress: undefined,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,

      // swap
      swap: undefined
    };

    this.state = this.initialState;
  }

  render() {
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install a wallet.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    // The next thing we need to do, is to ask the user to connect their wallet.
    // When the wallet gets connected, we are going to save the users's address
    // in the component's state. So, if it hasn't been saved yet, we have
    // to show the ConnectWallet component.
    //
    // Note that we pass it a callback that is going to be called when the user
    // clicks a button. This callback just calls the _connectWallet method.
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // If the token data or the user's balance hasn't loaded yet, we show
    // a loading component.
    if (!this.state.selectedAddress) {
      return <Loading />;
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <p>
              Welcome <b>{this.state.selectedAddress}</b>.
            </p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
            {/* 
              Sending a transaction isn't an immediate action. You have to wait
              for it to be mined.
              If we are waiting for one, we show a message here.
            */}
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}

            {this.state.swap && (
              <SwapMessage
                message = {this.state.swap}
                dismiss = {() => this._dismissNewSwapEvent()}
              />
            )}

            {/* 
              Sending a transaction can fail in multiple ways. 
              If that happened, we show a message here.
            */}
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <SwapContract 
              newSwap={ (receiver, hashlock, timelock, tokenType, tokenContractAddress,
                  tokenId, tokenAmount) => this._createNewSwap(receiver, hashlock, timelock, tokenType, 
                tokenContractAddress,
                tokenId, tokenAmount)}
              getSwap = { (tokenType, swapId) => this._getSwap(tokenType, swapId)}
              withdraw = { (tokenType, swapId, preImage) => this._swapWithdraw(tokenType, swapId, preImage)}
              rollback = { (tokenType, swapId) => this._swapRollback(tokenType, swapId) } >
            </SwapContract>
          </div>
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    // We poll the user's balance, so we have to stop doing that when Dapp
    // gets unmounted
    this._stopPollingData();
  }

  async _connectWallet() {
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    console.log("get selected address", selectedAddress)

    // Once we have the address, we can initialize the application.

    this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state 
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      this._initialize(newAddress);
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp

    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });

    // Then, we initialize ethers, fetch the token's data, and start polling
    // for the user's balance.

    // Fetching the token data and the user's balance are specific to this
    // sample project, but you can reuse the same initialization pattern.
    this._initializeEthers();
    this._startPollingData();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    // Then, we initialize the contract using that provider and the token's
    // artifact. You can do this same thing with your contracts.
    this._swapEther = new ethers.Contract(
      swapEtherContractAddress.Swap,
      SwaperEtherArtifact.abi,
      this._provider.getSigner(0)
    );

    this._swapErc20 = new ethers.Contract(
      swapErc20ContractAddress.Swap,
      SwaperErc20Artifact.abi,
      this._provider.getSigner(0)
    );

    this._swapErc721 = new ethers.Contract(
      swapErc721ContractAddress.Swap,
      SwaperErc721Artifact.abi,
      this._provider.getSigner(0)
    );

    console.log("init all swap smart contract end");
  }

  // The next two methods are needed to start and stop polling data. While
  // the data being polled here is specific to this example, you can use this
  // pattern to read any data from your contracts.
  //
  // Note that if you don't need it to update in near real time, you probably
  // don't need to poll it. If that's the case, you can just fetch it when you
  // initialize the app, as we do with the token data.
  _startPollingData() {
    this._pollDataInterval = setInterval(() => {}, 1000);

    // We run it once immediately so we don't have to wait for it
    // this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  _dismissNewSwapEvent() {
    this.setState({ swap: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  async _createNewSwap(receiver, hashlock, timelock, tokenType,
    tokenContractAddress,
    tokenId, tokenAmount) {
      console.log("tokenAmount",receiver, hashlock, timelock,
      tokenType, tokenContractAddress, tokenId, tokenAmount)
      try {
        this._dismissTransactionError();
        let contract;
        let tx;
        if (tokenType == "ether") {
          tx = await this._swapEther.newSwap(receiver, hashlock, timelock,
            { value: ethers.BigNumber.from(tokenAmount) })
        } else if (tokenType == "ERC20") {
          tx = await this._swapErc20.newSwap(receiver, hashlock, timelock,
            tokenContractAddress, ethers.BigNumber.from(tokenAmount));
        } else {
          tx = await this._swapErc721.newSwap(receiver, hashlock, timelock,
            tokenContractAddress, ethers.BigNumber.from(tokenId))
        }

        console.log("newSwap tx", tx)
        this.setState({txBeingSent: tx.hash})

        // wait confirm
        const receipt = await tx.wait();
        console.log("newSwap tx receipt", receipt)

        // some error
        if (receipt.status == 0) {
          throw new Error("Transaction failed");
        }

        this.setState({
          swap: receipt.events[0].args
        })
      } catch (error) {
        // We check the error code to see if this error was produced because the
        // user rejected a tx. If that's the case, we do nothing.
        if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
          return;
        }

        // Other errors are logged and stored in the Dapp's state. This is used to
        // show them to the user, and for debugging.
        console.error(error);
        this.setState({ transactionError: error });
      } finally {
        this.setState({
          txBeingSent: undefined
        });
      }
  }

  async _getSwap(tokenType, swapId) {
    console.log("get swap", tokenType, swapId)
    try {
      this._dismissTransactionError();
      let contract = this._getContract(tokenType);
      
      let swap = await contract.getSwap(swapId);

      console.log("getSwap swap", swap)

      this.setState(
        {swap: swap}
      )
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({
        txBeingSent: undefined
      });
    }
  }

  async _swapWithdraw(tokenType, swapId, preimage) {
    try {
      this._dismissTransactionError();
      let contract = this._getContract(tokenType);
      
      let tx = await contract.withdraw(swapId, preimage);

      console.log("withdraw tx", tx)
      this.setState({txBeingSent: tx.hash})

      // wait confirm
      const receipt = await tx.wait();
      console.log("withdraw tx receipt", receipt)
      
      // some error
      if (receipt.status == 0) {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({
        txBeingSent: undefined
      });
    }
  }

  async _swapRollback(tokenType, swapId) {
    try {
      this._dismissTransactionError();
      let contract = this._getContract(tokenType);
      
      let tx = await contract.rollback(swapId);

      console.log("rollback tx", tx)
      this.setState({txBeingSent: tx.hash})

      // wait confirm
      const receipt = await tx.wait();
      console.log("rollback tx receipt", receipt)
      
      // some error
      if (receipt.status == 0) {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({
        txBeingSent: undefined
      });
    }
  }

  _getContract(tokenType) {
    if (tokenType == "ether") {
      return this._swapEther;
    } else if (tokenType == "erc20") {
      return this._swapErc20;
    } else {
      return this._swapErc721;
    }
  }
}
