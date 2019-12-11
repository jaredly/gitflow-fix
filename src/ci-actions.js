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
import { hasLanded } from "./types";

import type { Action } from "./actions";

export const releaseBranch = (version: string) => `release/unified/${version}`;

const readyForCodeFreeze = (ticket, state: State) =>
  ticket.fixVersion === state.nextVersion &&
  ticket.targetBranch === "develop" &&
  hasLanded(ticket.status);

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
  const currentReleaseBranch = releaseBranch(state.nextVersion);
  if (
    !state.remoteBranches.some(
      branch => branch.name === currentReleaseBranch,
    ) &&
    state.tickets.some(ticket => readyForCodeFreeze(ticket, state))
  ) {
    actions.push({
      branch: currentReleaseBranch,
      action: "code freeze",
      title: "Code freeze",
    });
  }
  return actions.map(action => ({ ...action, type: "ci" }));
};

const codeFreeze = (branchName: string, state: State) => {
  // everything that's got fixVersion set and has been landed
  const tickets = state.tickets.map(ticket => {
    if (readyForCodeFreeze(ticket, state)) {
      return {
        ...ticket,
        targetBranch: branchName,
        status: "landed",
      };
    } else {
      return ticket;
    }
  });
  const develop = state.remoteBranches.find(b => b.name === "develop");
  if (!develop) {
    throw new Error("no develop branch");
  }
  return {
    ...state,
    tickets,
    remoteBranches: state.remoteBranches.concat([
      { name: branchName, commits: develop.commits },
    ]),
  };
};

export const applyCiAction = (
  branchName: string,
  action: string,
  state: State,
): State => {
  switch (action) {
    case "code freeze":
      return codeFreeze(branchName, state);
    case "build":
      const branch = state.remoteBranches.find(b => b.name === branchName);
      if (!branch) {
        console.log("branch not found");
        return state;
      }
      const buildNumber =
        state.builds.reduce((max, build) => Math.max(max, build.id), 0) + 1;
      const coveredTickets = branch.commits.reduce(
        (map, commit) =>
          commit.ticket ? ((map[commit.ticket] = true), map) : map,
        {},
      );
      return {
        ...state,
        builds: state.builds.concat([{ id: buildNumber, prs: [] }]),
        tickets: state.tickets.map(ticket => {
          if (ticket.targetBranch !== branchName) {
            return ticket;
          }
          if (ticket.status === "landed" && coveredTickets[ticket.id]) {
            return {
              ...ticket,
              status: "ready for qe",
              buildUrl: `bitrise.com/build/${buildNumber}`,
            };
          } else if (ticket.status !== "done") {
            return {
              ...ticket,
              buildUrl: `bitrise.com/build/${buildNumber}`,
            };
          } else {
            return ticket;
          }
        }),
      };
  }
  return state;
};
