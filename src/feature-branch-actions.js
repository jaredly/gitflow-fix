// @flow

export type FeatureBranchAction = {
  type: "feature-branch",
  branch: string,
  title: string,
  action: string,
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
import { baseBranch } from "./ticket-actions";

export const featureBranchActions = (state: State) => {
  const actions = [];
  state.remoteBranches.forEach(branch => {
    if (branch.name.startsWith("feature/")) {
      if (
        state.tickets.every(
          ticket =>
            ticket.targetBranch != branch.name || hasLanded(ticket.status),
        ) &&
        state.pullRequests.every(pr => pr.head != branch.name)
      ) {
        actions.push({
          type: "feature-branch",
          branch: branch.name,
          title: "Create PR for " + branch.name,
          action: "pr",
        });
      }
    }
  });
  return actions;
};

export const applyFeatureBranchAction = (
  who: Actor,
  branch: string,
  action: string,
  state: State,
): State => {
  switch (action) {
    case "pr":
      const fixVersion = state.tickets.reduce(
        (v, t) => v || (t.targetBranch === branch ? t.fixVersion : null),
        null,
      );
      const nextTicketNum =
        state.tickets.reduce((max, t) => Math.max(max, t.id), 0) + 1;
      const base = fixVersion ? baseBranch(fixVersion, state) : "develop";
      const prNumber =
        state.pullRequests.reduce((max, p) => Math.max(max, p.number), 0) + 1;
      return {
        ...state,
        pullRequests: state.pullRequests.concat([
          {
            number: prNumber,
            owner: who.name,
            summary: `Land ${branch}`,
            reviewStatus: "waiting",
            ticket: nextTicketNum,
            merged: false,
            head: branch,
            base: base,
            mergeable: true,
          },
        ]),
        tickets: state.tickets.concat([
          {
            id: nextTicketNum,
            title: `Test feature ${branch}`,
            status: "ready for qe",
            assignee: who.name,
            fixVersion: null,
            targetBranch: branch,
            buildUrl: null,
            pullRequest: prNumber,
            qeVerifiable: true,
            type: "feature-test",
          },
        ]),
      };
  }
  return state;
};
