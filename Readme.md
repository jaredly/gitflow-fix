
What is the state of the world?
- tickets, in columns
  - status
  - fixversion
  - targetbranch
  - type (bug / software task)

- github pull-requests
  - summary
  - review status (waiting, accepted, rejected)
  - base
  - head
  - mergeable

- local git repo
  - commits
  - branch

- "code chunk"
  - in a local git repo
  - on github, in a pull-request
  - on a branch on github

------------- what happens at the transitions -------------

- ticket in todo
- ticket moved to in-progress
  - local git branch created, n stuff
- ticket moved to in-review
  - with a github pr, generally