FROM node:8

# Create project directory
RUN mkdir -p /opt/jupiter-gitleaks-powerup
WORKDIR /opt/jupiter-gitleaks-powerup

# Install latest build of gitleaks binary (golang, no external deps)
COPY --from=zricethezav/gitleaks:latest /usr/bin/gitleaks /usr/bin/gitleaks

COPY yarn.lock package.json /opt/jupiter-gitleaks-powerup/

RUN yarn install --production --cache-folder .ycache && \
  rm -rf .ycache

# Bundle jupiter-gitleaks-powerup source
COPY ./src /opt/jupiter-gitleaks-powerup/src/

COPY gitleaks.config /opt/jupiter-gitleaks-powerup/gitleaks.config

RUN ssh-keyscan -t rsa bitbucket.org >> /etc/ssh/ssh_known_hosts

ENTRYPOINT ["node", "/opt/jupiter-gitleaks-powerup/src/index.js"]
