#!/bin/bash

export $(grep -v '^#' ../.env | xargs)
find . -name \*.yml | while read yml; do j1 -o create --entity -a $J1_ACCOUNT_ID -f $yml; done