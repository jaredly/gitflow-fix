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
import { releaseBranch } from "./ci-actions";

export type TicketAction = {
  title: string,
  type: "ticket",
  id: number,
  action: string,
  role: "pm" | "dev" | "qe" | string,
};

export const ticketActions = (ticket: Ticket, state: State): Array<Action> => {
  const actions = [];
  if (!ticket.fixVersion) {
    actions.push({ title: "Prioritize", action: "prioritize", role: "pm" });
  }
  if (!ticket.assignee && ticket.type !== "feature-test") {
    actions.push({ title: "Start work", action: "start", role: "dev" });
  }
  if (ticket.status === "ready for qe") {
    actions.push({ title: "QE Accept", action: "accept", role: "qe" });
    actions.push({ title: "QE Reject", action: "reject", role: "qe" });
  }
  if (ticket.status === "qe rejected") {
    actions.push({ title: "Resume work", action: "resume", role: "dev" });
  }
  if (ticket.status === "in progress" && ticket.assignee) {
    actions.push({
      title: "Set Blocked",
      action: "blocked",
      role: ticket.assignee,
    });
  }
  if (ticket.status === "blocked" && ticket.assignee) {
    actions.push({
      title: "Unblock",
      action: "unblock",
      role: ticket.assignee,
    });
  }
  return actions.map(action => ({ ...action, type: "ticket", id: ticket.id }));
};

const replaceTicket = (state, id, ticket) => ({
  ...state,
  tickets: state.tickets.map(t => (t.id === id ? ticket : t)),
});

export const applyTicketAction = (
  id: number,
  who: Actor,
  action: string,
  state: State,
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
        fixVersion: state.nextVersion,
      });
    case "accept":
      return replaceTicket(state, id, {
        ...ticket,
        status: "ready to release",
      });
    case "reject":
      return replaceTicket(state, id, { ...ticket, status: "qe rejected" });
    case "unblock":
      return replaceTicket(state, id, { ...ticket, status: "in progress" });
    case "blocked":
      return replaceTicket(state, id, { ...ticket, status: "blocked" });
    case "resume":
      if (who.type !== "dev") {
        throw new Error("only devs can start on a ticket");
      }
      const newPerson = {
        ...who,
        env: {
          ...who.env,
          localBranches: who.env.localBranches.concat([
            {
              ticket: id,
              pr: null,
              name: "MOB-" + id,
              upstream: ticket.targetBranch || "develop",
              parent: ticket.targetBranch || "develop",
            },
          ]),
        },
      };
      return replaceTicket(
        {
          ...state,
          actors: state.actors.map(p => (p.name != who.name ? p : newPerson)),
        },
        id,
        {
          ...ticket,
          status: "in progress",
          buildUrl: null,
          pr: null,
          assignee: who.name,
        },
      );
    case "start":
      if (who.type !== "dev") {
        throw new Error("only devs can start on a ticket");
      }
      return replaceTicket(
        {
          ...state,
          actors: state.actors.map(p =>
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
                        upstream:
                          ticket.targetBranch ||
                          baseBranch(ticket.fixVersion, state),
                        parent:
                          ticket.targetBranch ||
                          baseBranch(ticket.fixVersion, state),
                      },
                    ]),
                  },
                },
          ),
        },
        id,
        {
          ...ticket,
          status: "in progress",
          assignee: who.name,
        },
      );
  }
  console.log("action not recongized");
  return state;
};

export const baseBranch = (fixVersion: ?string, state: State) => {
  if (!fixVersion) {
    return "develop";
  }
  const branch = releaseBranch(fixVersion);
  if (state.remoteBranches.some(b => b.name === branch)) {
    return branch;
  }
  return "develop";
};
