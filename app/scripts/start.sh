#!/bin/bash
if [ ! -f "/ssh/id_rsa" ]; then
    ssh-keygen -b 2048 -t rsa -f /ssh/id_rsa -q -N ""
fi

if [ -z "$(ls -A ./node_modules 2>/dev/null)"  ]; then
    echo "Installing dependencies"
    npm i
fi

if [ "$USE_LOCALHOST_RUN" -eq "1" ]; then
    ssh-keyscan ssh.localhost.run > $HOME/.ssh/known_hosts
    ssh -R 80:localhost:3000 -i /ssh/id_rsa ssh.localhost.run &
fi

npm start
