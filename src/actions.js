// @flow

import type {
  State,
  Ticket,
  PullRequest,
  Actor,
  DevEnv,
  LocalBranch,
} from "./types";

import type { BranchAction } from "./branch-actions";
import type { TicketAction } from "./ticket-actions";
import type { PrAction } from "./pr-actions";
import type { CiAction } from "./ci-actions";
import type { CreationAction } from "./creation-actions";

export type Action =
  | BranchAction
  | TicketAction
  | PrAction
  | CiAction
  | CreationAction;

export type PMAction =
  | {
      type: "prioritize",
      issue: number,
    }
  | {
      type: "assign-next-fix-version",
      issue: number,
    };

export type RelEngAction =
  | {
      type: "code-freeze",
    }
  | {
      type: "rc-build",
    };

export type DevAction =
  | {
      type: "start",
      issue: number,
    }
  | {
      type: "pull-request",
      branch: string,
    }
  | {
      type: "pr-accept",
      pr: number,
    }
  | {
      type: "pr-reject",
      pr: number,
    }
  | {
      type: "land",
      pr: number,
    }
  | {
      type: "land-feature",
      branch: string,
    }
  | {
      type: "pr-feature",
      branch: string,
    };

// export type CIAction =
//   | {
//       type: "build-nightly",
//     }
//   | {
//       type: "build-dogfood",
//       branch: string,
//     }
//   | {
//       type: "build-feature",
//       branch: string,
//     };

export type QEAction =
  | {
      type: "accept",
      issue: number,
    }
  | {
      type: "reject",
      issue: number,
    }
  | {
      type: "feature-bug",
      feature: string,
    };
