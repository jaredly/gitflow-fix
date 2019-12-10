// @flow
import React from "react";
import "./App.css";
import {
  initialState,
  statuses,
  type State,
  type Ticket as TicketT
} from "./types";

import { ticketActions } from "./actions";

const Ticket = ({ ticket, onSelect, selection }) => {
  return (
    <div
      onClick={onSelect}
      style={{
        border: "1px solid #aaa",
        padding: "8px",
        fontSize: "80%",
        boxShadow: selection && selection.type === 'ticket' && selection.ticket === ticket.id
        ? '0 0 5px #aaa' : ''
      }}
    >
      <div
        style={{
          fontSize: "80%",
          color: "#ccc",
          alignSelf: "flex-start",
          marginBottom: 4
        }}
      >
        {"MOB-" + ticket.id}
      </div>
      {ticket.title}
    </div>
  );
};

function Columns({ state, setSelection }) {
  return (
    <div style={{ padding: "4px", flexDirection: "row", height: 300 }}>
      {statuses.map(status => (
        <div
          key={status}
          style={{
            border: "1px solid #aaa",
            margin: "4px",
            padding: "8px",
            width: 90
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            {status}
          </div>
          <div>
            {state.tickets
              .filter(ticket => ticket.status === status)
              .map(ticket => (
                <Ticket
                selection={state.selection}
                  key={ticket.id}
                  ticket={ticket}
                  onSelect={() =>
                    setSelection({ type: "ticket", ticket: ticket.id })
                  }
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const actionsForSelection = (state: State) => {
  if (!state.selection) {
    return [];
  }
  switch (state.selection.type) {
    case "ticket":
      return ticketActions(state.selection.ticket, state);
    default:
      return [];
  }
};

const Actions = ({ state, takeAction }) => {
  const actions = actionsForSelection(state); // todo include release & ci actions
  return (
    <div style={{height: 200, overflow: 'auto'}}>
      {actions.map(action => (
        <div key={action.action}>
          {action.type + '-'} 
          {action.action}
          <button onClick={() => takeAction(action)}>
            Take Action
          </button>
        </div>
      ))}
    </div>
  );
};

const reducer = (state: State, action) => {
  switch (action.type) {
    case "selection":
      return { ...state, selection: action.selection };
  }
  return state;
};

function App() {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  return (
    <div className="App">
      {/* <header className="App-header">
        Ok
      </header> */}
      <Columns
        state={state}
        setSelection={selection => dispatch({ type: "selection", selection })}
      />
      <Actions state={state} takeAction={dispatch} />
    </div>
  );
}

export default App;
