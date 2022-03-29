import React, { FC, useState, ChangeEvent } from 'react';
import logo from './logo.svg';
import './App.css';
import { generateJWT } from './utils/JWT';
const App: FC = () => {
  const [user, setUser] = useState('');
  const handleChangeInput = (ev: ChangeEvent<HTMLInputElement>) => {
    setUser(ev.target.value);
  }
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <input type="text" onChange={handleChangeInput} />
        <button type='button' onClick={async () => { 
          if (user) {
            await generateJWT(user)
          }
         }}>JWT</button>
      </header>
    </div>
  );
}

export default App;
