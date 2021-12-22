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

### Usage with Docker

`docker run -v /target/file/path:/scan -e J1_ACCOUNT="$J1_ACCOUNT" -e J1_ACCESS_TOKEN="$J1_ACCESS_TOKEN" -e HOST_IDENTIFIER="$(hostname)" --rm jupiterone/ingest-log4j-vulns`

Use `-v /:/scan` to scan the entire filesystem (recommended).

NOTES: 
* This does not run as root and does not scan container images. 
* The `HOST_IDENTIFIER` env var is needed since this information is not available inside the running Docker container.
* If desired, you may also specify `-e HOST_IP="some.ip.addr"` to provide the outer hosts' IP address.

## Expected Workflow:

The following suggested workflow can be used to identify and remediate Log4j
vulnerabilities across your entire fleet of hosts.

Step 1: Deployment

Deploy this software to your hosts via MDM, Ansible, Chef, etc.

Step 2: Scanning

Periodically scan your hosts by creating a CRON job that runs every hour.

`0 * * * * /path/to/scan-for-log4j.sh`

or

`0 * * * * docker run -v /target/file/path:/scan -e J1_ACCOUNT="$J1_ACCOUNT" -e J1_ACCESS_TOKEN="$J1_ACCESS_TOKEN" --rm jupiterone/ingest-log4j-vulns`

Step 3: Monitoring in JupiterOne

Issue queries like the following:

* `Find log4j_vulnerability as v ORDER BY v._createdOn ASC` - vulnerable hosts, oldest findings first
* `Find log4j_vulnerability as v return v.hostname, count(v) as vulns ORDER BY vulns DESC` - show vulnerable hosts, rank ordered by number of vulnerabilities

Step 4: Remediate Hosts

As you work to remediate hosts, the above query results will automatically return fewer results over time as these hosts' passing scans report in.



[1]: https://github.com/ossie-git/log4shell_sentinel
[2]: https://github.com/ossie-git/log4shell_sentinel/releases/tag/v1.0.0
