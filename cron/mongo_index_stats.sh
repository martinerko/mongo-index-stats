#!/bin/bash
#
# mongo-index-stats
# Copyright(c) 2017 martinerko <martinerko@gmail.com>
# MIT Licensed
#
# This script will export statistics about index usage from all collection in the database.
# Files will be created into directory specified by TARGET variable, with format collectionName.json .
# Setup a cron job that will run this job at the end of the day.
# It will always create a new directory and bunch of files in it.
# These files will be used as a source for producing a nice report about index usage.

# define your connection string here
connection="mongo localhost/test -u admin -p Sup3rP4$$ --authenticationDatabase admin"

TARGET="data/$(date '+%Y-%m-%d')"
exportData=1

if [ $exportData -eq 1 ]; then

  if [ -e "$TARGET" ]; then
    echo "cleaning up $TARGET directory"
    rm -r "$TARGET"
  fi

  echo "creating $TARGET directory"
  mkdir -p "$TARGET"
fi

# export index usage stats
function getStats {
  col=$1

  echo "\
    db.$col.aggregate([\
    {\$indexStats:{}},\
      {\$project:{\
        name:1,\
        key:1,\
        accesses:1,\
        snapshot:{\
         \$add: [\
           new Date(),0\
         ]\
        }\
      }\
    }\
    ]).toArray()" | $(echo $connection) --quiet
}

# get list of collections
collections=($(echo 'show collections' | $(echo $connection) --quiet))

for c in "${collections[@]}"
do
  echo "--------- $c ---------"
  stats="$(getStats $c)";
  # get rid of data types and save it under collectionName.json
  echo $stats | sed -E 's/(NumberLong|ISODate)\(([^\)]+)\)/\2/g' >> "$TARGET/$c.json";
done
