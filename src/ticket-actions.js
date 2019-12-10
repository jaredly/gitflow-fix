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

export type TicketAction = {
  title: string,
  type: "ticket",
  id: number,
  action: string,
  role: "pm" | "dev" | "qe",
};

export const ticketActions = (ticket: Ticket, state: State): Array<Action> => {
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
                        upstream: "develop",
                        parent: "develop",
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
          assignee: "me",
        },
      );
  }
  console.log("action not recongized");
  return state;
};
