// @flow
import React from "react";
import "./App.css";
import {
  initialState,
  statuses,
  type Selection,
  type State,
  type Ticket as TicketT
} from "./types";

import { ticketActions, applyTicketAction } from "./actions";

const Strut = ({ size }) => <div style={{ flexBasis: size }} />;

const styles = {
  label: {
    fontSize: "80%",
    color: "#ccc"
  }
};

const Ticket = ({ ticket, onSelect, selection }) => {
  return (
    <div
      onClick={onSelect}
      style={{
        border: "1px solid #aaa",
        padding: "8px",
        fontSize: "80%",
        boxShadow:
          selection &&
          selection.type === "ticket" &&
          selection.ticket === ticket.id
            ? "0 0 5px #aaa"
            : ""
      }}
    >
      <div style={styles.label}>{"MOB-" + ticket.id}</div>
      <Strut size={4} />
      {ticket.title}
      <Strut size={4} />
      <div style={styles.label}>Fix version: {ticket.fixVersion}</div>
    </div>
  );
};

function Columns({ state, setSelection, selection }) {
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
                  selection={selection}
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

const actionsForSelection = (state: State, selection: ?Selection) => {
  if (!selection) {
    return [];
  }
  switch (selection.type) {
    case "ticket":
      return ticketActions(selection.ticket, state);
    default:
      return [];
  }
};

const Actor = ({ state, actor, actions, takeAction }) => {
  const applicable = actions.filter(action => action.role === actor.type);
  if (!applicable.length) {
    return null;
  }
  return (
    <div>
      <div>Actor: {actor.name}</div>
      <div>
        {applicable.map(action => (
          <div key={action.action}>
            {action.type + "-"}
            {action.action}
            <button onClick={() => takeAction({ action, who: actor })}>
              Take Action
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Actions = ({ state, selection, takeAction }) => {
  const actions = actionsForSelection(state, selection); // todo include release & ci actions
  return (
    <div style={{ height: 200, overflow: "auto" }}>
      {state.actors.map(actor => (
        <Actor
          key={actor.name}
          state={state}
          actions={actions}
          actor={actor}
          takeAction={takeAction}
        />
      ))}
    </div>
  );
};

const reducer = (state: State, { action, who }) => {
  switch (action.type) {
    case "ticket":
      return applyTicketAction(action.id, who, action.action, state);
  }
  return state;
};

function App() {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [selection, setSelection] = React.useState(null);
  return (
    <div className="App">
      <Columns
        state={state}
        setSelection={setSelection}
        selection={selection}
      />
      <Actions state={state} selection={selection} takeAction={dispatch} />
    </div>
  );
}

export default App;
