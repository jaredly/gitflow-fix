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

import { type Action } from "./actions";
import { ticketActions, applyTicketAction } from "./ticket-actions";
import { branchActions, applyBranchAction } from "./branch-actions";
import { prActions, applyPrAction } from "./pr-actions";

const Strut = ({ size }) => <div style={{ flexBasis: size }} />;

const styles = {
  label: {
    fontSize: "80%",
    color: "#ccc",
  },
};

const Ticket = ({ ticket, onSelect, selection, state }) => {
  const fields = [
    ["Fix version", ticket.fixVersion],
    ["Assignee", ticket.assignee],
    ["Target branch", ticket.targetBranch],
    ["Pull Request", ticket.pullRequest],
  ];
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
      {fields.map(([title, v]) =>
        v != null ? (
          <>
            <Strut key={title + "-strut"} size={4} />
            <div style={styles.label} key={title}>
              {title}: {v}
            </div>
          </>
        ) : null,
      )}
      <ActionsBadge
        state={state}
        selection={{ type: "ticket", ticket: ticket.id }}
      />
    </div>
  );
};

function Columns({ state, setSelection, selection }) {
  return (
    <div style={{ padding: "8px", flexDirection: "row", height: 400 }}>
      {statuses.map((status, i) => (
        <div
          key={status}
          style={{
            border: "1px solid #aaa",
            borderWidth: i === 0 ? "1px" : "1px 1px 1px 0",
            margin: 0,
            padding: "4px",
            width: 130,
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
    case "pr":
      const pr = state.pullRequests.find(pr => pr.number === selection.pr);
      if (!pr) {
        return [];
      }
      return prActions(pr, state);
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
      return action.role === actor.type || action.role === actor.name;
    case "pr":
      return (
        (action.owner === actor.name) === (action.action === "land") &&
        actor.type === "dev"
      );
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
  takeAction: (
    action: { type: "actor", who: ActorT, action: Action } | MultiAction,
  ) => void,
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
            <button
              onClick={() => takeAction({ type: "actor", action, who: actor })}
            >
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
    case "pr":
      return applyPrAction(who, action.number, action.action, state);
  }
  return state;
};

type MultiAction = {
  type: "state-history",
  position: number,
};

const multiReducer = inner => (state, action) => {
  if (action.type === "state-history") {
    return { ...state, position: action.position };
  }
  const newState = inner(state.states[state.position].contents, action);
  return {
    ...state,
    states: [makeMultiState(newState)].concat(
      state.states.slice(state.position),
    ),
    position: 0,
  };
};

const KEY = "gitflow-state";

const logger = inner => (state, action) => {
  const newState = inner(state, action);
  console.log(action);
  console.log(newState);
  return newState;
};

const makeMultiState = contents => ({ contents, date: Date.now(), name: null });

const loadStates = () => {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    return { states: [makeMultiState(initialState)], position: 0 };
  }
  return JSON.parse(raw);
};

const clearState = () => {
  localStorage.removeItem(KEY);
};

const saveStates = states => {
  localStorage.setItem(KEY, JSON.stringify(states));
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
  const [showMerged, setShowMerged] = React.useState(false);
  const mergedCount = state.pullRequests.filter(p => p.merged).length;
  return (
    <div style={{ width: 300, alignItems: "flex-start" }}>
      <div style={{ flexDirection: "row", justifyContent: "space-between" }}>
        Pull Requests:
        {mergedCount > 0 ? (
          <button
            style={{ marginLeft: 8 }}
            onClick={() => setShowMerged(!showMerged)}
          >
            {showMerged ? "Hide merged" : `Show ${mergedCount} merged`}
          </button>
        ) : null}
      </div>
      <div>
        {state.pullRequests.map(pr =>
          !pr.merged || showMerged ? (
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
              <div style={{ padding: 4 }}>{pr.reviewStatus}</div>
              <ActionsBadge
                state={state}
                selection={{ type: "pr", pr: pr.number }}
              />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
};

function App() {
  const [outerState, dispatch] = React.useReducer(
    multiReducer(logger(reducer)),
    loadStates(),
  );
  const [selection, setSelection] = React.useState(null);
  const state = outerState.states[outerState.position].contents;
  const actions = actionsForSelection(state, selection); // todo include release & ci actions
  return (
    <div className="App">
      <div style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <div style={{ width: 200, padding: 8 }}>
          <button onClick={clearState}>Clear State</button>
          <button onClick={() => saveStates(outerState)}>Save State</button>
          <div>
            {outerState.states.map((inner, i) => (
              <div
                key={i}
                tabIndex={0}
                // onFocus={() => }
                // ref={node =>
                //   i === outerState.position ? node && node.focus() : null
                // }
                onKeyDown={evt => {
                  console.log(evt.key);
                  if (evt.key === "ArrowDown") {
                    dispatch({
                      type: "state-history",
                      position: Math.min(i + 1, outerState.states.length - 1),
                    });
                  } else if (evt.key === "ArrowUp") {
                    dispatch({
                      type: "state-history",
                      position: Math.max(0, i - 1),
                    });
                  }
                }}
                style={{
                  padding: "4px 8px",
                  cursor: "pointer",
                  backgroundColor: i === outerState.position ? "#555" : "",
                }}
                onFocus={() => dispatch({ type: "state-history", position: i })}
              >
                {new Date(inner.date).toLocaleTimeString()}
              </div>
            ))}
          </div>
        </div>
        <div>
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
      </div>
    </div>
  );
}

export default App;
