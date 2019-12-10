// @flow
export type PrAction = {
  type: "pr",
  title: string,
  number: number,
  action: string,
  owner: string,
};

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

export const prActions = (pr: PullRequest, state: State): Array<Action> => {
  const actions = [];
  if (pr.reviewStatus !== "accepted") {
    actions.push({ title: "Accept pull-request", action: "accept" });
  }
  if (pr.reviewStatus !== "rejected") {
    actions.push({ title: "Reject pull-request", action: "reject" });
  }
  if (pr.reviewStatus === "accepted" && !pr.merged) {
    actions.push({ title: "Land pull-request", action: "land" });
  }
  return actions.map(action => ({
    ...action,
    type: "pr",
    owner: pr.owner,
    number: pr.number,
  }));
};

const replacePr = (state, pr) => ({
  ...state,
  pullRequests: state.pullRequests.map(p => (p.number === pr.number ? pr : p)),
});

export const applyPrAction = (
  who: Actor,
  number: number,
  action: string,
  state: State,
): State => {
  if (who.type !== "dev") {
    return state;
  }
  const pr = state.pullRequests.find(pr => pr.number === number);
  if (!pr) {
    return state;
  }
  switch (action) {
    case "reject":
      return replacePr(state, { ...pr, reviewStatus: "rejected" });
    case "accept":
      return replacePr(state, { ...pr, reviewStatus: "accepted" });
  }
  return state;
};
