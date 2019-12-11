// @flow

export type CreationAction = {
  type: "creation",
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

import type { Action } from "./actions";

export const creationActions = (state: State) => {
  return [
    {
      type: "creation",
      title: "Add a bug",
      action: "bug",
    },
    {
      type: "creation",
      title: "Add a large feature",
      action: "feature-branch",
    },
    {
      type: "creation",
      title: "Add a task",
      action: "task",
    },
  ];
};

const choose = items => items[parseInt(Math.random() * items.length)];

const blank = {
  id: 0,
  title: "",
  status: "todo",
  assignee: null,
  fixVersion: null,
  targetBranch: null,
  buildUrl: null,
  pullRequest: null,
  qeVerifiable: true,
  type: "bug",
};

const verb = [
  "display",
  "collapse",
  "open",
  "disappear",
  "flip",
  "jump",
  "run",
];

const noun = ["profile", "dropdown", "image", "search bar", "hubcap"];

const adj = ["green", "new", "old", "perseus", "MAP", "SAT"];

const randomTask = (id: number): Ticket => {
  return {
    ...blank,
    id,
    title: `${choose(["Update", "Create", "Expand", "Enflare"])} the ${choose(
      adj,
    )} ${choose(noun)}`,
    type: "bug",
  };
};

const randomIssue = (id: number): Ticket => {
  return {
    ...blank,
    id,
    title: `The ${choose(noun)} doesn't ${choose(verb)} correctly`,
    type: "bug",
  };
};

const randomFeatureBranch = (id: number) => {
  const tickets = [];
  const featureName = `${choose(adj)}-${choose(noun)}`;
  const branchName = `feature/${featureName}`;
  const num = (Math.random() * 3 + 3) | 0;
  for (let i = 0; i < num; i++) {
    tickets.push({
      ...randomTask(id + i),
      targetBranch: branchName,
      qeVerifiable: false,
    });
  }
  const branch = { name: branchName, commits: [] };
  return { tickets, branch };
};

export const applyCreationAction = (action: string, state: State): State => {
  const nextTicketNum =
    state.tickets.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  switch (action) {
    case "task":
      return {
        ...state,
        tickets: state.tickets.concat([randomTask(nextTicketNum)]),
      };
    case "bug":
      return {
        ...state,
        tickets: state.tickets.concat([randomIssue(nextTicketNum)]),
      };
    case "feature-branch":
      const { tickets, branch } = randomFeatureBranch(nextTicketNum);
      return {
        ...state,
        tickets: state.tickets.concat(tickets),
        remoteBranches: state.remoteBranches.concat([branch]),
      };
  }
  return state;
};
