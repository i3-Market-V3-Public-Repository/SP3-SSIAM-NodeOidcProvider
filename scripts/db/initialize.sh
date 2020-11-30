#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

./wait

echo "Start initialization script"
mongo -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --host db --authenticationDatabase admin $MONGO_INITDB_DATABASE < $DIR/initialize.js
