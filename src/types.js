// @flow

// what is the state of the world?

type Status =
  | "todo"
  | "blocked"
  | "in progress"
  | "in review"
  | "landed"
  | "ready for qe"
  | "qe rejected"
  | "ready to release"
  | "done";
export const statuses: Array<Status> = [
  "todo",
  "blocked",
  "in progress",
  "in review",
  "landed",
  "ready for qe",
  "qe rejected",
  "ready to release",
  "done",
];

export const hasLanded = (status: Status) =>
  status === "landed" ||
  status === "ready for qe" ||
  status === "qe rejected" ||
  status === "ready to release";

export type Role = "pm" | "dev" | "qe";
export const roles: Array<Role> = ["pm", "dev", "qe"];

export type Ticket = {
  id: number,
  title: string,
  status: Status,
  assignee: ?string,
  fixVersion: ?string,
  targetBranch: ?string,
  buildUrl: ?string,
  pullRequest: ?number,
  qeVerifiable: boolean,
  type: "bug" | "task",
};

export type PullRequest = {
  owner: string,
  number: number,
  summary: string,
  reviewStatus: "waiting" | "accepted" | "rejected",
  ticket: ?number,
  merged: boolean,
  head: string,
  base: string,
  mergeable: boolean,
};

export type LocalBranch = {
  ticket: ?number,
  pr: ?number,
  name: string,
  upstream: string,
  parent: string,
};

export type Selection =
  | {
      type: "ticket",
      ticket: number,
    }
  | {
      type: "branch",
      owner: string,
      branch: string,
    }
  | {
      type: "pr",
      pr: number,
    };

export type Release = {
  branch: string,
};

export type Build = {
  id: number,
  prs: Array<number>,
};

export type RemoteBranch = {
  commits: Array<{
    pr: number,
    ticket: ?number,
  }>,
  name: string,
};

export type State = {|
  tickets: Array<Ticket>,
  pullRequests: Array<PullRequest>,
  remoteBranches: Array<RemoteBranch>,
  builds: Array<Build>,
  actors: Array<Actor>,
  nextVersion: string,
  release: ?Release,
|};

export const initialState: State = {
  release: null,
  builds: [],
  remoteBranches: [
    {
      name: "develop",
      commits: [],
    },
  ],
  tickets: [
    {
      id: 1,
      title: "The frobulator doesn't display correctly",
      status: "todo",
      assignee: null,
      fixVersion: null,
      targetBranch: null,
      buildUrl: null,
      pullRequest: null,
      qeVerifiable: true,
      type: "bug",
    },
    {
      id: 2,
      title: "Implement the profile header",
      status: "todo",
      assignee: null,
      fixVersion: null,
      targetBranch: null,
      buildUrl: null,
      pullRequest: null,
      qeVerifiable: true,
      type: "task",
    },
  ],
  pullRequests: [],
  actors: [
    {
      type: "dev",
      name: "jared",
      env: { localBranches: [], activeBranch: "develop" },
    },
    {
      type: "dev",
      name: "lilli",
      env: { localBranches: [], activeBranch: "develop" },
    },
    {
      type: "qe",
      name: "robert",
    },
    {
      type: "pm",
      name: "susan",
    },
  ],
  nextVersion: "7.0.0",
};

export type Actor =
  | {
      type: "dev",
      name: string,
      env: DevEnv,
    }
  | {
      type: "pm",
      name: string,
    }
  | {
      type: "ci",
      name: string,
    }
  | {
      type: "qe",
      name: string,
    };

export type DevEnv = {
  localBranches: Array<LocalBranch>,
  activeBranch: string,
};

// const findUnclaimedTicket = (state: State) => {
//   for (const ticket of state.tickets) {
//     if (!ticket.assignee) {
//       return ticket
//     }
//   }
//   return null;
// }

// const takeTicket = (me: Actor, state: State) => {
//   const ticket = findUnclaimedTicket(state);
//   if (!ticket) {
//     return null
//   }
// };
