import React, { useState } from 'react';
import './App.css';
import Liquidity from './Liquidity.js';
import Chief from './Chief.js';
import FlipETHA from './FlipETHA.js';
import FlipBATA from './FlipBATA.js';
import Flop from './Flop.js';

function App() {
  const [page, setPage] = useState("AUCTIONS");

  return (
    <div className="App">
      <header className="App-header">
        <h2>
          mkr.fyi
        </h2>
        <div className="settings">
          <h4 onClick={() => setPage("FLIPETHA")}>flip eth-a</h4>
          <h4>&nbsp;|&nbsp;</h4>
          <h4 onClick={() => setPage("FLIPBATA")}>flip bat-a</h4>
          <h4>&nbsp;|&nbsp;</h4>
          <h4 onClick={() => setPage("FLOP")}>flop</h4>
          <h4>&nbsp;|&nbsp;</h4>
          <h4 onClick={() => setPage("LIQ")}>mkr liquidity</h4>
        </div>
        {(function() {
          switch (page) {
            case 'LIQ':
              return <div><Chief/><Liquidity/></div>;
            case 'FLIPETHA':
              return <FlipETHA/>;
            case 'FLIPBATA':
              return <FlipBATA/>;
            case 'FLOP':
              return <Flop/>;
            default:
              return null;
          }
        })()}
      </header>
    </div>
  );
}

export default App;
