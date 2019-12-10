// @flow
import type {
  State,
  Ticket,
  PullRequest,
  Actor,
  DevEnv,
  LocalBranch,
} from "./types";
import type { Action } from "./actions";

export type BranchAction = {
  title: string,
  type: "branch",
  owner: string,
  branch: string,
  action: string,
};

export const branchActions = (
  owner: string,
  branch: LocalBranch,
  state: State,
): Array<Action> => {
  const actions = [];
  if (!branch.pr) {
    actions.push({ title: "Create pull-request", action: "pr" });
  }
  return actions.map(action => ({
    ...action,
    type: "branch",
    owner,
    branch: branch.name,
  }));
};

export const applyBranchAction = (
  who: Actor,
  branchName: string,
  action: string,
  state: State,
): State => {
  if (who.type !== "dev") {
    return state;
  }
  const branch = who.env.localBranches.find(b => b.name === branchName);
  if (!branch) {
    return state;
  }
  switch (action) {
    case "pr":
      const prNumber =
        state.pullRequests.reduce((max, pr) => Math.max(max, pr.number), 0) + 1;
      const newBranch = {
        ...branch,
        pr: prNumber,
      };
      return {
        ...state,
        actors: state.actors.map(a =>
          a.name === who.name
            ? {
                ...who,
                env: {
                  ...who.env,
                  localBranches: who.env.localBranches.map(b =>
                    b.name === branch.name ? newBranch : b,
                  ),
                },
              }
            : a,
        ),
        tickets: branch.ticket
          ? state.tickets.map(t =>
              t.id === branch.ticket ? { ...t, status: "in review" } : t,
            )
          : state.tickets,
        pullRequests: state.pullRequests.concat([
          {
            owner: who.name,
            number: prNumber,
            summary: branch.ticket
              ? "Fix MOB-" + branch.ticket
              : "Small non-ticketed thing",
            reviewStatus: "waiting",
            ticket: branch.ticket,
            merged: false,
            head: branch.name,
            base: branch.parent,
            mergeable: true,
          },
        ]),
      };
  }
  return state;
};
