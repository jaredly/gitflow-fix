// @flow
import React from "react";
import "./App.css";
import {
  initialState,
  statuses,
  type Selection,
  type State,
  type Ticket as TicketT,
  type Actor as ActorT,
} from "./types";

import {
  ticketActions,
  applyTicketAction,
  branchActions,
  applyBranchAction,
  type Action,
} from "./actions";

const Strut = ({ size }) => <div style={{ flexBasis: size }} />;

const styles = {
  label: {
    fontSize: "80%",
    color: "#ccc",
  },
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
            : "",
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
            width: 90,
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

const actionsForSelection = (
  state: State,
  selection: ?Selection,
): Array<Action> => {
  if (!selection) {
    return [];
  }
  switch (selection.type) {
    case "ticket":
      const ticket = state.tickets.find(
        ticket => ticket.id === selection.ticket,
      );
      if (!ticket) {
        return [];
      }
      return ticketActions(ticket, state);
    case "branch":
      const owner = state.actors.find(
        actor => actor.name === selection.owner && actor.type === "dev",
      );
      if (!owner || owner.type !== "dev") {
        return [];
      }
      const branch = owner.env.localBranches.find(
        branch => branch.name === selection.branch,
      );
      if (!branch) {
        return [];
      }
      return branchActions(owner.name, branch, state);
    default:
      return [];
  }
};

const isActionApplicable = (action, actor) => {
  switch (action.type) {
    case "branch":
      return action.owner === actor.name;
    case "ticket":
      return action.role === actor.type;
  }
};

const Actor = ({
  state,
  actor,
  actions,
  takeAction,
  selection,
  setSelection,
}: {
  state: State,
  actor: ActorT,
  actions: Array<Action>,
  selection: ?Selection,
  setSelection: Selection => void,
  takeAction: (action: { who: ActorT, action: Action }) => void,
}) => {
  const applicable = actions.filter(action =>
    isActionApplicable(action, actor),
  );
  // if (!applicable.length) {
  //   return null;
  // }
  return (
    <div style={{ alignItems: "flex-start" }}>
      <div
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignSelf: "stretch",
        }}
      >
        <div>
          {actor.type}: {actor.name}
        </div>
        {applicable.map(action => (
          <div
            key={action.action}
            style={{
              flexDirection: "row",
            }}
          >
            <button onClick={() => takeAction({ action, who: actor })}>
              {action.title}
            </button>
          </div>
        ))}
      </div>
      <div></div>
      {actor.type === "dev"
        ? actor.env.localBranches.map(branch => (
            <div
              key={branch.name}
              style={{
                padding: 4,
                backgroundColor:
                  selection &&
                  selection.type === "branch" &&
                  selection.branch === branch.name
                    ? "#666"
                    : "",
              }}
              onClick={() => {
                setSelection({
                  type: "branch",
                  branch: branch.name,
                  owner: actor.name,
                });
              }}
            >
              {branch.name}
            </div>
          ))
        : null}
    </div>
  );
};

const Actions = ({ state, selection, setSelection, takeAction }) => {
  const actions = actionsForSelection(state, selection); // todo include release & ci actions
  return (
    <div style={{ height: 200, overflow: "auto" }}>
      {state.actors.map(actor => (
        <Actor
          setSelection={setSelection}
          selection={selection}
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
    case "branch":
      return applyBranchAction(who, action.branch, action.action, state);
  }
  return state;
};

const logger = inner => (state, action) => {
  const newState = inner(state, action);
  console.log(action);
  console.log(newState);
  return newState;
};

function App() {
  const [state, dispatch] = React.useReducer(logger(reducer), initialState);
  console.log("state", state);
  const [selection, setSelection] = React.useState(null);
  return (
    <div className="App">
      <Columns
        state={state}
        setSelection={setSelection}
        selection={selection}
      />
      <Actions
        setSelection={setSelection}
        state={state}
        selection={selection}
        takeAction={dispatch}
      />
    </div>
  );
}

export default App;
