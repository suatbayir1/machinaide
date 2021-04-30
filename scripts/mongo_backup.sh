#!/bin/sh
DIR=`date +%m%d%y`
DEST=/home/machinaide/mongo_backups/$DIR
mkdir $DEST
mongodump --port 27017 --authenticationDatabase "admin" --username "machinaide" --password "erste2020" --db machinaide -o $DEST

