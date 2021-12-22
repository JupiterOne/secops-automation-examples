# syntax=docker/dockerfile:1.2

FROM node:14-alpine

RUN apk update && apk upgrade && apk add wget bash

COPY . . 

RUN wget https://github.com/ossie-git/log4shell_sentinel/releases/download/v1.0.0/log4shell_sentinel_v1.0.0-linux-amd64.tar.gz

# This should produce just the binary
RUN tar -zxf log4shell_sentinel_v1.0.0-linux-amd64.tar.gz

# This puts it on our $PATH so our shell script works as expected
RUN mv log4shell_sentinel /bin

RUN npm i

CMD ["./scan-for-log4j.sh", "/scan"]