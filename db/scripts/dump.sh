#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source $DIR/config.source

# Load args
DUMP_PATH=${1:-$DIR/dump}


mongodump -u $MONGO_INITDB_ROOT_USERNAME -p $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin -o $DUMP_PATH
rm -rf $DUMP_PATH/admin
