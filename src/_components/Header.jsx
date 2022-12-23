import React, { useEffect, useState } from "react";
import logo from "../images/logo.png";
import { BrowserRouter, Link, Routes, Route } from "react-router-dom"; 

import Home from "./Home"

function Header() {
  
  const [userGallery, setGallery] = useState();

  async function getNFTs(){

    // const userNFTIds = await opend.getOwnerNFT(CURRENT_USER_ID);
    // setGallery(<Gallery title="My NFTs" ids={userNFTIds} role="collection" />);

    // const listedNFTIds = await opend.getListedNFT();
    // setListedGallery(<Gallery title="Discover" ids={listedNFTIds} role="discover" />);
  }

//   useEffect( () => getNFTs(), []);

  return (
    <BrowserRouter forceRefresh={true}>
    <div className="app-root-1">
      <header className="Paper-root AppBar-root AppBar-positionStatic AppBar-colorPrimary Paper-elevation4">
        <div className="Toolbar-root Toolbar-regular header-appBar-13 Toolbar-gutters">
          <div className="header-left-4"></div>
          <img className="header-logo-11" src={logo} />
          <div className="header-vertical-9"></div>
          <h5 className="Typography-root header-logo-text">
            <Link to="/">
              MomentoX
            </Link>
          </h5>
          <div className="header-empty-6"></div>
          <div className="header-space-8"></div>
          <button className="ButtonBase-root Button-root Button-text header-navButtons-3">
          <Link to="/minter"> 
            Minter
            </Link>
          </button>
          <button className="ButtonBase-root Button-root Button-text header-navButtons-3">
          <Link to="/collection"> 
            My NFTs
            </Link>
          </button>
        </div>
      </header>
    </div>
        <Routes>
        <Route path="/" element={<Home />}>
        </Route>
        <Route path="/minter">
          Minter
        </Route>
        <Route path="/collection">
          {userGallery}
        </Route>
      </Routes>
    </BrowserRouter>

  );
}

export default Header;
