# Documenting security assessment findings

`/security-assessment`

- Write your lightweight assessment report and findings in YAML
- Run `publish.sh` to upload the entities to your JupiterOne account
- See the results with a J1QL query like this:

  ```j1ql
  Find Assessment that identified (Risk|Finding) return tree
  ```

More information:

- https://support.jupiterone.io/hc/en-us/articles/360022721954-SecOps-Artifacts-as-Code

You can then use an automated script to generate PDF reports for each assessment
and its findings. See [`/security-assessment-report`][1] in this repo.

[1]: ../security-assessment-report/README.md
