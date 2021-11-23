# Risk Management with JupiterOne

Here's an opinionated guide on Risk Management using the JupiterOne platform:

## Step 1: Maintain a version-controlled risk register

We use GitHub for all version control. Create a private repo for corporate use, say `internal-security-artifacts` or similar.

In this repo, store your Risks as one or more YAML or JSON files, as [documented in our NodeJS client README][1].

For example, you might create a `risks.yml` with the following structure:


```
---
  - entityId:
    entityKey: risk:some-kind-of-identified-risk
    entityType: technical_risk
    entityClass: Risk
    properties:
      name: Some Identified Risk
      displayName: Some Identified Risk
      summary: Corp has identified a risk of type foo
      description:
        Current controls are insufficient to mitigate technical risk presented by
        foo. This situation provides a sufficiently motivated attacker the means
        to abuse privileges and/or consume unauthorized resources.
      details:
      category: technical
      threats: privilege escalation, denial-of-service
      targets: corporate cloud account
      probability: 2-5%, median of 3%
      impact: $30,000
      score: $600-$1,500 annualized loss exposure
      status: open
      assessment: corp-risk-assessment-2021
      reporter: security.analyst@corp.com
      open: true
      mitigation:
        - monitoring changes to the cloud resource configurations and access
      jiraKey:
      webLink:

```

Several of these fields have conventional meaning that will be leveraged by J1 queries:

| Property    | Description |
| ----------- | ----------- |
| category    | Type of risk, e.g. physical, logical, human, etc.  |
| threats   | comma-delimited list of threats posed by the risk        |
| targets   | asset targets affected by threat: devices, networks, applications, data, users |
| probability | integer model of likelihood: 0-100%, can be a range with a median |
| impact | integer model of business impact if exploited: ideally, dollar values but if that's not easy to obtain, use planning poker card values (0, 1, 2, 3, 5, 8, 13, 20, 40, 100), a fibonacci sequence (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, ...), or orders of magnitude (1x, 10x, 100x, etc.). Pick an impact scoring model and stick with it consistently. Do not use different impact models unless it is to characterize it in monetary terms. Under no circumstances should you use ordinal numbers (e.g., 1st, 2nd, 3rd, 4th, 5th) |
| score  | integer product of probability median x impact |
| status | current state of risk, one of: open, mitigated, transferred, accepted |
| assessment | name of associated risk assessment activity, if any |
| reporter | email address of user that identified or reported the risk |
| mitigation | list/array of controls or mitigating activity performed to reduce this risk |
| webLink | url link to additional documentation or issues |

## Step 2: Ingest Risks into J1 graph

Periodically, you can upload `risks.yml` to the graph using the [NodeJS Client][2]:

Export the ENV vars `J1_ACCOUNT` and `J1_ACCESS_TOKEN`, and issue a command like:

```
j1 -o update --entity -a "$J1_ACCOUNT" -k "$J1_ACCESS_TOKEN" -f ./risks.yml
```

You might also automate this step via GitHub Action or similar CI/CD tooling.

## Step 3: Add Insights Dashboard for Risk Registry

From the [Insights Home][3], click `+` (add), then `Add team board`. Select 'Risk Register' from the list of available templates:

<img width="1015" alt="Dashboard Templates" src="https://user-images.githubusercontent.com/513523/142741991-f2696b3f-a69e-4121-818f-ed133703dcae.png">

## Step 4: Use Risk Register Dashboard during periodic risk review

<img width="1426" alt="Risk Register Dashboard" src="https://user-images.githubusercontent.com/513523/142742057-191de967-6315-43d4-83da-192fd597ffef.png">

**ProTip**: as an output of this periodic activity, generate additional PRs to your `internal-security-artifacts` repo `risk.yml` file. These PRs can serve as compliance evidence of periodic review activity by the Security team.

[1]: https://github.com/JupiterOne/jupiterone-client-nodejs#create-or-update-entities-from-a-json-input-file
[2]: https://github.com/JupiterOne/jupiterone-client-nodejs
[3]: https://apps.us.jupiterone.io/insights/home
