#!/bin/bash
if [ ! -f "$HOME/.ssh/id_rsa" ]; then
    ssh-keygen -b 2048 -t rsa -f $HOME/.ssh/id_rsa -q -N ""
fi

if [ -z "$(ls -A ./node_modules)"  ]; then
    echo "Installing dependencies"
    npm i
fi

npm start &
ssh -R 80:localhost:3000 ssh.localhost.run
