// @flow

// what is the state of the world?

type Status = 'todo' | 'blocked' | 'in progress' | 'in review' | 'landed' | 'ready for qe' | 'qe rejected' | 'done'
export const statuses: Array<Status> = ['todo' , 'blocked' , 'in progress' , 'in review' , 'landed' , 'ready for qe' , 'qe rejected' , 'done']

type Ticket = {
  id: number,
  title: string,
  status: Status,
  assignee: ?string,
  fixVersion: ?string,
  targetBranch: ?string,
  deployUrl: ?string,
  pullRequest: ?number,
  qeVerifiable: boolean,
  type: 'bug' | 'task',
}

type PullRequest = {
  number: number,
  summary: 'string',
  reviewStatus: 'waiting' | 'accepted' | 'rejected',
  ticket: ?number,
  merged: boolean,
  head: string,
  base: string,
  mergeable: boolean,
}

type LocalBranch = {
  ticket: ?number,
  pr: ?number,
  name: string,
  upstream: string,
  parent: string,
}

type State = {
  tickets: Array<Ticket>,
  pullRequests: Array<PullRequest>,
  localBranches: Array<LocalBranch>,
}

export const initialState: State = {
  tickets: [{
    id: 1,
    title: 'The frobulator doesn\'t display correctly',
    status: 'todo',
    assignee: null,
    fixVersion: null,
    targetBranch: null,
    deployUrl: null,
    pullRequest: null,
    qeVerifiable: true,
    type: 'bug',
  }],
  pullRequests: [],
  localBranches: [],
};

type Person = {
  login: string,
}

// const findUnclaimedTicket = (state: State) => {
//   for (const ticket of state.tickets) {
//     if (!ticket.assignee) {
//       return ticket
//     }
//   }
//   return null;
// }

// const takeTicket = (me: Person, state: State) => {
//   const ticket = findUnclaimedTicket(state);
//   if (!ticket) {
//     return null
//   }
// };
