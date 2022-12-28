import React, { useState, useEffect } from 'react';
import Button from './Button';

import Web3 from 'web3';
// import momentoX from "../contracts/MomentoX.json";
import momentoX from "../MomentoX.json";

function Item(props) {

    const [nftName, setName] = useState(); 
    const [url, setUrl] = useState();
    const [desc, setDesc] = useState();
    const [eth, setEth] = useState();
    const [openseaUrl, setOpenseaUrl] = useState();

    const [loaderHidden, setLoaderHidden] = useState(true);
    const [claimText, setClaimText] = useState("Claim ETH");

    const [transferInput, setTransferInput] = useState();
    const [transferButton, setTransferButton] = useState(<Button handleClick={handleTransfer} text="Transfer" />);

    async function loadWeb3() {
      // get injected web3
      if (!window.ethereum) {
          console.log("metamask not installed");
          return;
      }
      const web3 = new Web3(window.ethereum);
      try {
          // Request account access if needed
          await window.ethereum.enable();
      } catch (error) {
          console.log(error);  
      }
      return web3;
    }

    async function loadContract(web3) {
      // Get the contract instance.
      //const networkId = 1672019604467; 
      const networkId = await web3.eth.getChainId();
      const contractAddr = momentoX.networks[networkId].address;
      const momentoXToken = new web3.eth.Contract(
          momentoX.abi,
          contractAddr,
      );
      return momentoXToken;
    }

    async function fetchNftData() {
      const web3 = await loadWeb3();
      const contract = await loadContract(web3);
      console.log(web3);
      console.log(contract);
      console.log(contract._address);
      setOpenseaUrl("https://testnets.opensea.io/assets/goerli/" + contract._address + "/" + props.id);

      const uri = await contract.methods.tokenURI(props.id).call();
      console.log(uri);
      const infusedEth = await contract.methods.getNftInfusedEth(props.id).call();
      console.log(infusedEth);
      setEth(web3.utils.fromWei(infusedEth, "ether"));

      const url = new URL(uri);

      // Get Json file
      const jsonUrl = "https://gateway.pinata.cloud/ipfs" + url.pathname;
      console.log(jsonUrl);
      const response = await fetch(jsonUrl);
      if(!response.ok)
          throw new Error(response.statusText);

      const json = await response.json();
      console.log(json);

      setName(json.name);
      setDesc(json.description);

      const imageUrl = new URL(json.image);
      setUrl("https://gateway.pinata.cloud/ipfs" + imageUrl.pathname);
    }

    useEffect( () => {
        fetchNftData();
    }, []);

    async function handleClaim() {
      setLoaderHidden(false);

      const web3 = await loadWeb3();
      const contract = await loadContract(web3);
      console.log(web3);
      console.log(contract);
      
      const accounts = await web3.eth.getAccounts();
      const txResult = await contract.methods.claimEth(props.id).send({from: accounts[0]});
      console.log(txResult);
      const infusedEth = await contract.methods.getNftInfusedEth(props.id).call();
      console.log(infusedEth);
      setEth(web3.utils.fromWei(infusedEth, "ether"));

      setClaimText("Success");
      setLoaderHidden(true);
    }

    let transferAddr;
    function handleTransfer() {
      setTransferButton(<Button handleClick={handleConfirmTransfer} text="Confirm" />)

      setTransferInput(<input
        placeholder="Address. eg. 0x1234567890123456789012345678901234567890"
        type="text"
        className="price-input"
        value={transferAddr}
        onChange={(e) => transferAddr = e.target.value}
      />);
    }

    async function handleConfirmTransfer() {
      setLoaderHidden(false);

      const web3 = await loadWeb3();
      const contract = await loadContract(web3);
      console.log(web3);
      console.log(contract);

      const accounts = await web3.eth.getAccounts();
      console.log(transferAddr);
      const txResult = await contract.methods.safeTransferInfusedNft(transferAddr, props.id).send({from: accounts[0]});
      console.log(txResult);
      const owner = await contract.methods.ownerOf(props.id).call();
      if(owner === transferAddr) {
        console.log("success: " + owner);
        setTransferButton(<Button handleClick={handleConfirmTransfer} text="Success" />);
      } else {
        setTransferButton(<Button handleClick={handleConfirmTransfer} text="Failed" />);
      }

      setLoaderHidden(true);
    }

    return (
        <div className="disGrid-item">
            <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
              <a className="momento-tooltip" href={openseaUrl} target="_blank">
                <img
                  className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
                  src={url}
                  alt={nftName}
                />
                <span className="momento-tooltiptext">Opensea</span>
              </a>
                <div className="disCardContent-root">
                  <h2 className="disTypography-root disTypography-h5 disTypography-gutterBottom">
                    {nftName}
                  </h2>
                  <p className="disTypography-root disTypography-body2 disTypography-colorTextSecondary disTypography-gutterBottom">
                    {desc}
                  </p>
                  <p className="disTypography-root disTypography-body2 momento-color">
                    Infused: {eth} ETH
                  </p>
                  <div hidden={loaderHidden} className="lds-ellipsis">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  {transferInput}
                  <Button handleClick={handleClaim} text={claimText} />
                  {transferButton}
                </div>
            </div>
        </div>
    );
}

export default Item;