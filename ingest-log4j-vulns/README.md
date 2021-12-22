# JupiterOne - Script to Ingest Log4J Vulnerabilities

This automation example ingests the output of [log4shell_sentinel][1], a
cross-platform tool that scans local filesystems and emits CSV output. This
ingestion script is intended for distribution/deployment to all hosts in your
environment that you would like to scan and remediate for log4j vulnerabilities.

## Dependencies / Installation

You will need to:
1. Clone this repo, containing the shell and Node scripts in this example
2. Run `npm install` to install dependencies
3. Install an [OS/arch-appropriate binary of log4shell_sentinel][2] on each target
host.

The ingestion script assumes `log4shell_sentinel` is available locally, and is
in your system's `$PATH`.

You will need to export the following ENV vars for ingestion:

* `J1_ACCOUNT`
* `J1_ACCESS_TOKEN`

## Usage

`sudo ./scan-for-log4j.sh`  - by default, scan the entire filesystem, including container images (recommended)

`./scan-for-log4j.sh ./some/target/path`  - scan only target path, additionally do not use superuser privs



[1]: https://github.com/ossie-git/log4shell_sentinel
[2]: https://github.com/ossie-git/log4shell_sentinel/releases/tag/v1.0.0
