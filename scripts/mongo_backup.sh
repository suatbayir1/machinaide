#!/bin/sh
DIR=`date +%m%d%y`
DEST=/mongo_backups/$DIR
mkdir $DEST

# save mongodb backup to spesific destination
mongodump --port 27017 --authenticationDatabase "admin" --username "machinaide" --password "erste2020" --db machinaide -o $DEST

# send mongodb backup to another server
sshpass -p "JN9TUG89BbKAen" scp -r /mongo_backups/$DIR root@173.212.226.239:/mongo_backups/