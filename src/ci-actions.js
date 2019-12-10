// @flow

export type CiAction = {
  type: "ci",
  title: string,
  action: string,
  branch: string,
};

import type {
  State,
  Ticket,
  PullRequest,
  Actor,
  DevEnv,
  LocalBranch,
} from "./types";

import type { Action } from "./actions";

export const ciActions = (state: State): Array<Action> => {
  const actions = [];
  for (const branch of state.remoteBranches) {
    const activeTickets = branch.commits.some(
      c => c.ticket != null && state.tickets.some(t => t.id === c.ticket),
    );
    if (activeTickets) {
      actions.push({
        branch: branch.name,
        action: "build",
        title: "Build " + branch.name,
      });
    }
  }
  return actions.map(action => ({ ...action, type: "ci" }));
};

export const applyCiAction = (
  branchName: string,
  action: string,
  state: State,
): State => {
  console.log("ok");
  switch (action) {
    case "build":
      const branch = state.remoteBranches.find(b => b.name === branchName);
      if (!branch) {
        console.log("branch not found");
        return state;
      }
      const coveredTickets = branch.commits.reduce(
        (map, commit) =>
          commit.ticket ? ((map[commit.ticket] = true), map) : map,
        {},
      );
      console.log(coveredTickets);
      return {
        ...state,
        tickets: state.tickets.map(ticket =>
          ticket.status === "landed" && coveredTickets[ticket.id]
            ? { ...ticket, status: "ready for qe" }
            : ticket,
        ),
      };
  }
  return state;
};
