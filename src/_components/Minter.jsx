import React, { useState } from 'react';
import axios from "axios";
import { useForm } from "react-hook-form";
import Item from './Item';

import Web3 from 'web3';
// import momentoX from "../contracts/MomentoX.json";
import momentoX from "../MomentoX.json";


// const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzYmQ1YmRjMy01NjgxLTQxYmItOTBlMy1kYjM0YjM2ZTI4NDQiLCJlbWFpbCI6Im1haWxtZS5rcUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJpZCI6IkZSQTEiLCJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MX0seyJpZCI6Ik5ZQzEiLCJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MX1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMTg3YTFkY2FmNDM2YzRkZjI2ZGMiLCJzY29wZWRLZXlTZWNyZXQiOiIzMzA3NDU3MWI1ZDJjMzIwNGNhZDRmMTA5MzU3NzRlOTE0OWVlODJiNDljNGE0NmIyMmZhMzkyMjczNDg0MTk4IiwiaWF0IjoxNjcxOTU1MzQzfQ.nRIjg2y5e2SQENqKll2b8jtIkmfKvauZBzElHn-US1s';
const API_KEY = '187a1dcaf436c4df26dc';
const API_SECRET = '33074571b5d2c3204cad4f10935774e9149ee82b49c4a46b22fa392273484198';

function Minter(props) {  
    const [mintedNft, setMintedNft] = useState("");
    const [loaderHidden, setLoaderHidden] = useState(true);
    const [previewHidden, setPreviewHidden] = useState(true);
    const [imgFile, setImageFile] = useState();
    const [previewImage, setPreviewImage] = useState();
    const { register, handleSubmit } = useForm("");

    async function handleImage(event){
        if(event.target.files[0]) {
            setPreviewHidden(false);
            setImageFile(event.target.files[0]);
            setPreviewImage(URL.createObjectURL(event.target.files[0]));
        }
    }

    async function onSubmit (data) {
        setLoaderHidden(false);

        console.log(data);
        console.log(imgFile);

        const momentoName = data.name;
        const momentoDesc = data.description;
        const ethInfused = data.ethAmount;

        //// get injected web3
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
        // // Get the contract instance.
        // const networkId = 1672019604467; 
        const networkId = await web3.eth.getChainId();
        const contractAddr = momentoX.networks[networkId].address;
        const momentoXToken = new web3.eth.Contract(
            momentoX.abi,
            contractAddr,
        );
        const nftId = await momentoXToken.methods.getTokenCounter().call();

        // Setting up to upload image to pinata
        const formData = new FormData();

        formData.append("file", imgFile);
        const metadata = JSON.stringify({
            name: imgFile.name,
        });
        formData.append('pinataMetadata', metadata);

        const options = JSON.stringify({
            cidVersion: 0,
        });
        formData.append('pinataOptions', options);
  
        // Upload image to pinata
        let imageHash = "";
        try{
            const res = await axios.post(
                "https://api.pinata.cloud/pinning/pinFileToIPFS", 
                formData, 
                {
                    maxBodyLength: "Infinity",
                    headers: {
                        'Content-Type': "multipart/form-data; boundary=${formData._boundary}",
                        'pinata_api_key': API_KEY,
                        'pinata_secret_api_key': API_SECRET
                    }
                }
            );
            console.log(res.data);
            imageHash = res.data.IpfsHash;
        } catch (error) {
            console.log(error);
        }

        // Setting up to upload json file
        const jsonData = JSON.stringify({
            "pinataOptions": {
                "cidVersion": 1
            },
            "pinataMetadata": {
                "name": "MomentoX #" + nftId,
                "keyvalues": {
                    "tokenId": "someNftId",
                }
            },
            "pinataContent": {
                "name": momentoName,
                "description": momentoDesc,
                "image": "ipfs://" + imageHash,
                "external_url": "https://stormy-badlands-77987.herokuapp.com/",
                "attributes": [
                    {
                        "trait_type": "Artefact", 
                        "value": "MomentoX"
                    },
                    {
                        "trait_type": "Collection", 
                        "value": "Genesis"
                    }
                ]
            }
        });

        let jsonHash = "";
        try{
            const config = {
                method: 'post',
                url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
                headers: { 
                    'Content-Type': 'application/json', 
                    'pinata_api_key': API_KEY,
                    'pinata_secret_api_key': API_SECRET
                },
                data : jsonData
            };

            const res = await axios(config);
            console.log(res.data);
            jsonHash = res.data.IpfsHash;
        } catch (error) {
            console.log(error);
        }

        /// Mint NFT
        const accounts = await web3.eth.getAccounts();
        console.log(accounts[0]);
        const ethInfusedWei = web3.utils.toWei(ethInfused, "ether");
        console.log(ethInfusedWei);
        await momentoXToken.methods.safeMintInfused(accounts[0], jsonHash, ethInfusedWei).send({from: accounts[0], value: ethInfusedWei});
        const tokenUri = await momentoXToken.methods.tokenURI(nftId).call();
        console.log(tokenUri);

        setMintedNft(nftId);
        setLoaderHidden(true);
      }

    if (mintedNft === "") {
        return (
            <div className="minter-container">
                <h3 className="makeStyles-title-99 Typography-h3 form-Typography-gutterBottom">
                    Create NFT
                </h3>
                <h6 className="form-Typography-root makeStyles-subhead-102 form-Typography-subtitle1 form-Typography-gutterBottom">
                    Upload Image
                </h6>
                <img
                    alt="NFT" 
                    src={previewImage}
                    className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
                    hidden={previewHidden}
                />
                <form className="makeStyles-form-109" noValidate="" autoComplete="off" >
                    <div className="upload-container">
                        <input
                            className="upload"
                            type="file"
                            accept="image/x-png,image/jpeg,image/gif,image/svg+xml,image/webp"
                            onChange={handleImage}
                        />
                    </div>

                    <h6 className="form-Typography-root makeStyles-subhead-102 form-Typography-subtitle1 form-Typography-gutterBottom">
                        Momento Name
                    </h6>
                    <div className="form-FormControl-root form-TextField-root form-FormControl-marginNormal form-FormControl-fullWidth">
                        <div className="form-InputBase-root form-OutlinedInput-root form-InputBase-fullWidth form-InputBase-formControl">
                            <input
                                placeholder="e.g. CryptoSBF"
                                type="text"
                                className="form-InputBase-input form-OutlinedInput-input"
                                {...register("name", {required: true}) }
                            />
                            <fieldset className="PrivateNotchedOutline-root-60 form-OutlinedInput-notchedOutline"></fieldset>
                        </div>
                    </div>

                    <h6 className="form-Typography-root makeStyles-subhead-102 form-Typography-subtitle1 form-Typography-gutterBottom">
                        Momento Description
                    </h6>
                    <div className="form-FormControl-root form-TextField-root form-FormControl-marginNormal form-FormControl-fullWidth">
                        <div className="form-InputBase-root form-OutlinedInput-root form-InputBase-fullWidth form-InputBase-formControl">
                            <input
                                placeholder="e.g. Memories of SBF"
                                type="text"
                                className="form-InputBase-input form-OutlinedInput-input"
                                {...register("description", {required: true}) }
                            />
                            <fieldset className="PrivateNotchedOutline-root-60 form-OutlinedInput-notchedOutline"></fieldset>
                        </div>
                    </div>

                    <h6 className="form-Typography-root makeStyles-subhead-102 form-Typography-subtitle1 form-Typography-gutterBottom">
                        Infused ETH
                    </h6>
                    <div className="form-FormControl-root form-TextField-root form-FormControl-marginNormal form-FormControl-fullWidth">
                        <div className="form-InputBase-root form-OutlinedInput-root form-InputBase-fullWidth form-InputBase-formControl">
                            <input
                                placeholder="Amount in ETH"
                                type="number"
                                className="form-InputBase-input form-OutlinedInput-input"
                                {...register("ethAmount", {required: true}) }
                            />
                            <fieldset className="PrivateNotchedOutline-root-60 form-OutlinedInput-notchedOutline"></fieldset>
                        </div>
                    </div>

                    <div hidden={loaderHidden} className="lds-ellipsis">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>

                    <div className="form-ButtonBase-root form-Chip-root makeStyles-chipBlue-108 form-Chip-clickable">
                        <span onClick={handleSubmit(onSubmit)} className="form-Chip-label">Mint NFT</span>
                    </div>
                </form>
            </div>
        );
    } else {
        return(
            <div className="minter-container">
                <h3 className="Typography-root makeStyles-title-99 Typography-h3 form-Typography-gutterBottom">
                    Minted!
                </h3>
                <div className="horizontal-center">
                    <Item id={mintedNft} />
                </div>
            </div>
        )
    }
}

export default Minter;