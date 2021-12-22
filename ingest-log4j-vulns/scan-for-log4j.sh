#!/usr/bin/env bash

set -eo pipefail

if [ -z "$J1_ACCOUNT" ] || [ -z "$J1_ACCESS_TOKEN" ]; then
  echo "You must export both J1_ACCOUNT and J1_ACCESS_TOKEN vars!"
  exit 2
fi

SCANPATH=${1:-/}
if [ "$SCANPATH" = "/scan" ]; then
  # relative scanpath hard-coded by Docker, ensure we're within volume-mounted dir
  # so persistent scoping works across runs...
  cd /scan
fi
echo "Scanning for Log4j vulnerabilities..."
log4shell_sentinel -p $SCANPATH -nb -nh -nm > ./results
node ./ingest-log4j-vulns.js