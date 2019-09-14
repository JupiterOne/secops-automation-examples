# Generating a PDF report from an assessment

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
