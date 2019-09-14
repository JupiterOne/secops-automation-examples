**Instructions (remove before committing)**

-   Fill out all the sections.
-   Open a PR to merge your changes into master and invite people you know will
    need to review the RFC
-   Post a notice to your team chat room (e.g. #team-phc) so other interested
    devs can review as needed. If the RFC might impact other teams then post a
    notice to #dev also.

# Template RFC <Replace with RFC title>

-   Start Date: (fill me in with today's date, YYYY-MM-DD)
-   RFC PR: (link to the PR)
-   Issue: (link to the Jira Issue)

## Summary

One paragraph explanation of the feature.

## Motivation

Why are we doing this? What use cases does it support? What is the expected
outcome?

Please focus on explaining the motivation so that if this RFC is not accepted,
the motivation could be used to develop alternative solutions. In other words,
enumerate the constraints you are trying to solve without coupling them too
closely to the solution you have in mind.

## Detailed design

This is the bulk of the RFC. Explain the design in enough detail for somebody
familiar with the software platform to understand, and for somebody familiar
with the implementation to implement. This should get into specifics and
corner-cases, and include examples of how the feature is used. Any new
terminology should be defined here.

## How We Teach This

What names and terminology work best for these concepts and why? How is this
idea best presented? As a continuation of existing npm patterns, existing
software platform patterns, or as a wholly new one?

Would the acceptance of this proposal mean our documentation must be
re-organized or altered? Does it change how it is taught to new users at any
level?

How should this feature be introduced and taught to existing users?

## Drawbacks

Why should we _not_ do this? Please consider the impact on teaching people, on
the integration of this feature with other existing and planned features, on the
impact of churn on existing users.

There are tradeoffs to choosing any path, please attempt to identify them here.

## Security considerations

### Data Flow

Does this feature collect or process additional data? Does it impact the current
data flow of the system/application?

If so, create new or update the existing data flow diagram and document the
data flow.

### Secrets

Does this feature involve usage of additional secrets (API keys, tokens, etc.),
either external (i.e. storing and using secrets from a provider) or internal
(i.e. generating and using secrets as an internal component)?

If so, document the secret management process.

### Attack Scenarios

How could an attacker abuse this design? What risks does this approach present
and what mitigations can be pursued? What security requirements need to be
included in the implementation?

An example of how to document this:

- **Abuse case name**
  - _Risk_ -- a description of the abuse case and the risks identified
  - _Mitigation_ -- what is being put in place as mitigation controls

This is a practice to ensure that some level of security considerations is
always included in the design of a new feature, component or process.

Note that this is a lightweight, fast-path approach but does not replace a full
threat model, which may be needed as a follow up to the RFC or is completed
separately for the broader product in scope. A full threat model can be a
complex and lengthy process - see
[OWASP document](https://www.owasp.org/index.php/Application_Threat_Modeling).

## Privacy Considerations

Does this feature introduce a new use case of data processing or new types of
user data being processed?

If so, review and document the following. Keep in mind that privacy management
is more than capturing user consents.

- Is the use case already covered by existing Privacy Policy and EULA (or Terms
  and Conditions)?

- Do we need to update or capture additional consent?

- Is the data included in the removal process upon user request or account
  deletion?

- Does the use of user data align with user expectations?

- How are users made aware of this additional use case / data collection in
  order to minimize surprise?

  > Consider just-in-time modal or notification for both awareness/education and
  > consent capture, if applicable.

- What controls are available to users on this data processing use case?
  For example:
  
  - <https://safety.google/privacy/privacy-controls/>

  - <https://www.facebook.com/help/325807937506242>

- Do we have a Help article documenting this use case and the privacy controls
  available to users?

## Alternatives

What other designs have been considered? What is the impact of not doing this?

## Unresolved questions

Optional, but suggested for first drafts. What parts of the design are still
TBD?
