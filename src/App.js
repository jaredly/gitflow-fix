import React from 'react';
import './App.css';
import {initialState, statuses, type State} from './types'

function Columns({state}: {state: State}) {

}

function App() {
  const [state, setState] = React.useState(initialState)
  return (
    <div className="App">
      <header className="App-header">
        Ok
      </header>
    </div>
  );
}

export default App;
