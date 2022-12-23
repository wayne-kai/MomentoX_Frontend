/// TO DO:
///   1. Unable to mint
///   2. window.ethereum.enable depreciated
///   3. refactor code to give window.ethereum instead of web3

import React, { Component } from "react";
import momentoX from "./contracts/MomentoX.json";

import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
    state = { loaded: false, currentAccount: 0, userTokens: 0, debugOwnerAddress: 0 };

    componentDidMount = async () => {
        try {
            // Get network provider and web3 instance.
            this.web3 = await getWeb3();

            // Use web3 to get the user's accounts.
            this.accounts = await this.web3.eth.getAccounts();


            // Get the contract instance.
            //this.networkId = await this.web3.eth.net.getId(); <<- this doesn't work with MetaMask anymore
            this.networkId = 1671708375162;   
            //this.networkId =await this.web3.eth.getChainId();

            this.contractAddr = momentoX.networks[this.networkId].address;

            this.momentoXToken = new this.web3.eth.Contract(
                momentoX.abi,
                momentoX.networks[this.networkId].address,
            );
            this.debugGetOwnerAddress();
            this.listenForAccountChange();
            this.listenToTokenTransfer();
            this.updateUserTokens();
            this.setState({ loaded:true, currentAccount:this.accounts[0]}, this.userTokens);
        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    }

    debugGetOwnerAddress = async() => {
        let debugOwnerAddress = await this.momentoXToken.methods.owner().call();
        this.setState({debugOwnerAddress: debugOwnerAddress});
    }

    updateConnectedAccount = async() => {
        this.accounts = await this.web3.eth.getAccounts();
        this.setState({currentAccount:this.accounts[0]});
    }

    listenForAccountChange = async() => {
        console.log(this.web3);
        console.log(window.ethereum);
        window.ethereum.on('accountsChanged', this.updateConnectedAccount);
    }

    updateUserTokens = async() => {
        let userTokens = await this.momentoXToken.methods.balanceOf(this.accounts[0]).call();
        this.setState({userTokens: userTokens});
    }

    listenToTokenTransfer = async() => {
        this.momentoXToken.events.Transfer({to: this.accounts[0]}).on("data", this.updateUserTokens);
    }

    handleMintNFT = async () => {
        //1ITLw5VSO8FsfTqDeSRNVJU_c7aCPR8u2
        const txResult = await this.momentoXToken.methods.safeMint(this.accounts[0],"angbao_1.json").send({from: this.accounts[0]});
        console.log(txResult);
    }

    render() {
        if (!this.state.loaded) {
            return <div>Loading Web3, accounts, and contract...</div>;
        }
        return (
        <div className="App">
            <h1>MomentoX</h1>
            <p>Customize your own unique NFT with your own personal touch. <br></br>Infused with value using precious Ether. <br></br>Surprise your loved ones with a special gift.<br></br>
                Allow your loved ones unlock the Ether on a significant day.<br></br>
                Embed a secret message in your NFT</p>
            <h2>Your Address</h2>
            <p>Your Address: {this.state.currentAccount}</p>
            <h3>Mint NFT</h3>
            <button type="button" onClick={this.handleMintNFT}>Mint NFT</button>
            <p>You have: {this.state.userTokens}</p>
            <p>(Debug) Owner of MomentoX Contract: {this.state.debugOwnerAddress}</p>
            <a href={"https://testnets.opensea.io/assets/goerli/"+this.contractAddr+"/0"}>(Debug) MomentoX Contract: {this.contractAddr}</a>
        </div>
        );
    }
}

export default App;