# Example automation scripts using JupiterOne platform

This repo provides a few simple examples on how to maintain security/compliance
as code and to automate SecOps using the JupiterOne platform.

The examples are in either `bash` or `javascript`.

These scripts are provided as is. For questions, please post in the
[jupiterone-community #dev][1] Slack workspace.

[1]: https://jupiterone-community.slack.com/messages/CJMV4SFV5

## Prerequisites and dependencies

You will need `jupiterone-client-nodejs`. It has been added as a dependency to
this project. You can also install it globally:

```bash
npm install @jupiterone/jupiterone-client-nodejs -g
```

You will need the following environment variables in your local `.env` file

```text
J1_ACCOUNT_ID=yourAccountId
J1_API_TOKEN=yourToken
```

## Documenting security assessment findings

`/security-assessment`

- Write your lightweight assessment report and findings in YAML
- Run `publish.sh` to upload the entities to your JupiterOne account
- See the results with a J1QL query like this:

  ```j1ql
  Find Assessment that identified (Risk|Finding) return tree
  ```

More information:

- https://support.jupiterone.io/hc/en-us/articles/360022721954-SecOps-Artifacts-as-Code

## Generating a PDF report from an assessment

`/security-assessment-report`

Run the following command from the above directory to generate a Markdown and a
PDF report of a security assessment by name, including all findings/risks
identified by the assessment.

```bash
export $(grep -v '^#' ../.env | xargs)
node generate-assessment-report.js --assessment 'name-of-the-assessment'
```

The `name-of-the-assessment` should match the value of `name` property of an
existing `Assessment` entity in your J1 account.

## Maintaining details about third-party vendors and accounts

`/vendor-management`

As part of your organization's third-party vendor management process, you will
most likely need to keep track of the details of each vendor, links to
contracts and agreements, and the accounts and users associated with each vendor.

If you use SAML Single Sign On (SSO) for your SaaS accounts and your SSO
provider has an integration with JupiterOne (e.g. Okta, OneLogin), the vendors
are mapped/inferred through the SSO app configuration.

For additional vendors, you can provide the details in a YAML file as shown in
the examples in this repo, and publish them to your JupiterOne account.

This way, you can leverage pull requests to serve as the vendor review/approval
process. The PR can also be the trigger for a security team member to conduct
more detailed vendor risk assessment, and provide a link to the
report/questionnaire as part of the vendor entity YAML.

**Entities:**

Each example vendor YAML file contains two "classes" of entity objects:

- `Vendor`: an entity representing the vendor itself.
- `Account`: one or more entities that represent the account(s) hosted by
  this vendor that users can log in to.

**Relationships:**

`Vendor -HOSTS-> Account`

When these entities are published to JupiterOne, a relationship between the
vendor and its accounts are automatically created, as long as the value of the
`vendor` property on the `Account` entity object matches the `name` of the
`Vendor`.

`Person -MANAGES-> Vendor`

Additionally, if there are `Person` entities within your JupiterOne account,
and their email addresses match the ones configured as `owners` on the `Vendor`
entity, a relationship will be automatically created between them.
