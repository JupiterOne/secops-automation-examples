# Maintaining details about third-party vendors and accounts

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
