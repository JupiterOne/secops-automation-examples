# Summary Relationships Script

This example looks for existing IAM policy ALLOWS relationships in the JupiterOne graph to create certain "summary" or shortcut relationships that highlight interesting inter-service and service source-to-sink connectivity that might otherwise be cumbersome to reason about or query for.

After running this script, instead of a query like:

```
FIND Function
THAT ASSIGNED AccessRole
THAT ASSIGNED AccessPolicy
THAT ALLOWS Function
```

You can instead write this query:

```
FIND Function
THAT EXECUTES Function
```

## Data Model

Function|Task --EXECUTES--> Function|Task

Function|Task --ACCESSES--> Database

Function|Task|Workload --ASYNC_NOTIFIES--> Function|Task|Workload (via intermediate Queue|Channel)

## Prerequisites

You will need to either `export` the following shell variables:

```bash
J1_API_TOKEN
J1_ACCOUNT
```

or add these variables to a `.env` file

If you are interacting with the dev environment (\*.apps.dev.jupiterone.io), also set an environment variable `J1_DEV_ENABLED`.

## Running the script

For EXECUTES and ACCESSES summary relationships, run `yarn start:executes`.

For ASYNC_NOTIFIES summary relationships, run `yarn start:notifies`.

## Re-running the script

These scripts make use of our bulk-upload api, and so these scripts can each be used safely to update the relationships in the graph based on the latest underlying IAM policies by re-running them periodically.

## Cleaning Up

To remove all summary relationships from your graph, run `./tools/bin/delete-summary-relationships`.
