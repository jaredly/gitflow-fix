// @flow

import type { State, Ticket, PullRequest, Actor } from "./types";

export const ticketActions = (
  id: number,
  state: State
): Array<{
  title: string,
  type: "ticket",
  id: number,
  action: string,
  role: "pm" | "dev" | "qe"
}> => {
  const ticket = state.tickets.find(ticket => ticket.id === id);
  if (!ticket) {
    return [];
  }
  const actions = [];
  if (!ticket.fixVersion) {
    actions.push({ title: "Prioritize", action: "prioritize", role: "pm" });
  }
  if (!ticket.assignee) {
    actions.push({ title: "Start work", action: "start", role: "dev" });
  }
  if (ticket.status === "ready for qe") {
    actions.push({ title: "QE Accept", action: "accept", role: "qe" });
    actions.push({ title: "QE Reject", action: "reject", role: "qe" });
  }
  return actions.map(action => ({ ...action, type: "ticket", id }));
};

const replaceTicket = (state, id, ticket) => ({
  ...state,
  tickets: state.tickets.map(t => (t.id === id ? ticket : t))
});

export const applyTicketAction = (
  id: number,
  who: Actor,
  action: string,
  state: State
): State => {
  const ticket = state.tickets.find(ticket => ticket.id === id);
  if (!ticket) {
    console.log("ticket not found");
    return state;
  }
  switch (action) {
    case "prioritize":
      return replaceTicket(state, id, {
        ...ticket,
        fixVersion: state.nextVersion
      });
    case "start":
      if (who.type !== "dev") {
        throw new Error("only devs can start on a ticket");
      }
      return replaceTicket(
        {
          ...state,
          person: state.actors.map(p =>
            p.name != who.name
              ? p
              : {
                  ...who,
                  env: {
                    ...who.env,
                    localBranches: who.env.localBranches.concat([
                      {
                        ticket: id,
                        pr: null,
                        name: "MOB-" + id,
                        upstream: "develop",
                        parent: "develop"
                      }
                    ])
                  }
                }
          )
        },
        id,
        {
          ...ticket,
          status: "in progress",
          assignee: "me"
        }
      );
  }
  console.log("action not recongized");
  return state;
};

// export const branchActions

export type IssueAction = {
  issue: number,
  action: "prioritize" | "start" | "accept" | "reject"
};
export type BranchAction = {
  branch: string,
  action:
    | "pull-request"
    | "land-feature"
    | "pr-feature"
    | "build-dogfood"
    | "build-feature"
};

export type Action = PMAction | RelEngAction | DevAction | QEAction | CIAction;

export type PMAction =
  | {
      type: "prioritize",
      issue: number
    }
  | {
      type: "assign-next-fix-version",
      issue: number
    };

export type RelEngAction =
  | {
      type: "code-freeze"
    }
  | {
      type: "rc-build"
    };

export type DevAction =
  | {
      type: "start",
      issue: number
    }
  | {
      type: "pull-request",
      branch: string
    }
  | {
      type: "pr-accept",
      pr: number
    }
  | {
      type: "pr-reject",
      pr: number
    }
  | {
      type: "land",
      pr: number
    }
  | {
      type: "land-feature",
      branch: string
    }
  | {
      type: "pr-feature",
      branch: string
    };

export type CIAction =
  | {
      type: "build-nightly"
    }
  | {
      type: "build-dogfood",
      branch: string
    }
  | {
      type: "build-feature",
      branch: string
    };

export type QEAction =
  | {
      type: "accept",
      issue: number
    }
  | {
      type: "reject",
      issue: number
    }
  | {
      type: "feature-bug",
      feature: string
    };
