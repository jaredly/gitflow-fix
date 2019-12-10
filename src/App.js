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

const Ticket = ({ ticket, onSelect, selection, state }) => {
  return (
    <div
      onClick={onSelect}
      style={{
        border: "1px solid #aaa",
        cursor: "pointer",
        padding: "8px",
        fontSize: "80%",
        position: "relative",
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
      <ActionsBadge
        state={state}
        selection={{ type: "ticket", ticket: ticket.id }}
      />
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
                  state={state}
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
    <div style={{ alignItems: "flex-start", padding: 4 }}>
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
      <div style={{ marginTop: 8 }}>
        {actor.type === "dev"
          ? actor.env.localBranches.map(branch => (
              <div
                key={branch.name}
                style={{
                  padding: 4,
                  cursor: "pointer",
                  position: "relative",
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
                <ActionsBadge
                  state={state}
                  selection={{
                    type: "branch",
                    branch: branch.name,
                    owner: actor.name,
                  }}
                />
              </div>
            ))
          : null}
      </div>
    </div>
  );
};

const Actors = ({ state, actions, selection, setSelection, takeAction }) => {
  return (
    <div style={{ height: 200, minWidth: 300, overflow: "auto" }}>
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

const KEY = "gitflow-state";

const logger = inner => (state, action) => {
  const newState = inner(state, action);
  console.log(action);
  console.log(newState);
  return newState;
};

const getInitialState = () => {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    return initialState;
  }
  return JSON.parse(raw);
};

const clearState = () => {
  localStorage.removeItem(KEY);
};

const saveState = state => {
  localStorage.setItem(KEY, JSON.stringify(state));
};

const prAction = pr => action =>
  action.type === "pr" && action.pr === pr.number;

const branchActionFilter = branch => action =>
  action.type === "branch" && action.branch === branch.name;

const ActionsBadge = ({ state, selection }) => {
  const applicable = actionsForSelection(state, selection).length;
  if (!applicable) {
    return null;
  }
  return (
    <div
      style={{
        padding: "2px 4px",
        fontSize: "50%",
        backgroundColor: "green",
        borderRadius: 4,
        position: "absolute",
        top: -4,
        right: -8,
      }}
    >
      {applicable}
    </div>
  );
};

const PullRequests = ({
  actions,
  setSelection,
  selection,
  state,
  takeAction,
}) => {
  return (
    <div style={{ minWidth: 300 }}>
      Pull Requests:
      <div>
        {state.pullRequests.map(pr => (
          <div
            key={pr.number}
            onClick={() => setSelection({ type: "pr", pr: pr.number })}
            style={{
              position: "relative",
              padding: 4,
              cursor: "pointer",
              backgroundColor:
                selection &&
                selection.type === "pr" &&
                selection.pr === pr.number
                  ? "#666"
                  : "",
            }}
          >
            {pr.summary}
            <ActionsBadge
              state={state}
              selection={{ type: "pr", pr: pr.number }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [state, dispatch] = React.useReducer(
    logger(reducer),
    getInitialState(),
  );
  console.log("state", state);
  const [selection, setSelection] = React.useState(null);
  const actions = actionsForSelection(state, selection); // todo include release & ci actions
  return (
    <div className="App">
      <button onClick={clearState}>Clear State</button>
      <button onClick={() => saveState(state)}>Save State</button>
      <Columns
        state={state}
        setSelection={setSelection}
        selection={selection}
      />
      <div style={{ flexDirection: "row" }}>
        <Actors
          setSelection={setSelection}
          state={state}
          actions={actions}
          selection={selection}
          takeAction={dispatch}
        />
        <Strut size={32} />
        <PullRequests
          setSelection={setSelection}
          state={state}
          actions={actions}
          selection={selection}
          takeAction={dispatch}
        />
      </div>
    </div>
  );
}

export default App;
