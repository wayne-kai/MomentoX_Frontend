import React, { useState, useEffect } from 'react';
import Item from "./Item";

import Web3 from 'web3';
// import momentoX from "../contracts/MomentoX.json";
import momentoX from "../MomentoX.json";
import { useParams } from 'react-router-dom';

function Gallery() {

    console.log("IN Gallery initialize state");
    const { ownerAddress } = useParams();
    console.log(ownerAddress);

    const [renderItem, setRender] = useState();
    console.log("IN Gallery end initialize state");
    useEffect(  () => {
        async function loadWallet() {

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

            /// To get nftId
            // Get the contract instance.
            // const networkId = 1672019604467;            
            const networkId = await web3.eth.getChainId();
            const contractAddr = momentoX.networks[networkId].address;
            const momentoXToken = new web3.eth.Contract(
                momentoX.abi,
                contractAddr,
            );

            // Use web3 to get the user's accounts.
            let account = 0;
            if (ownerAddress) {
                account = ownerAddress;
                console.log(ownerAddress);
            } else {
                const accounts = await web3.eth.getAccounts();
                account = accounts[0];
            }
            const listNfts = await momentoXToken.methods.getOwnerNFT(account).call();
            console.log(listNfts);
            setRender( listNfts.map( (nftId) => (
                <Item id={nftId} key={nftId} />
            ) ) );

        }
        loadWallet();
    }, []);
    
    return(
        <div className="gallery-view">
        <h3 className="makeStyles-title-99 Typography-h3 memento-text-shadow-3-3-2-white momento-color">MomentoX</h3>
        <div className="disGrid-root disGrid-container disGrid-spacing-xs-2">
          <div className="disGrid-root disGrid-item disGrid-grid-xs-12">
            <div className="disGrid-root disGrid-container disGrid-spacing-xs-5 disGrid-justify-content-xs-center">
            {renderItem}
            </div>
          </div>
        </div>
      </div>   
    );
}

export default Gallery;