#!/bin/sh
DIR=`date +%m%d%y`
DEST=/code_backups/$DIR.zip
SOURCE=/home/

# zip all machinaide codes
zip -r $DEST $SOURCE

# send zipped file to another server for backup
sshpass -p "JN9TUG89BbKAen" scp -r /code_backups/$DIR.zip root@173.212.226.239:/code_backups/


# MONGO BACKUP
MONGO_DEST=/mongo_backups/$DIR
mkdir $MONGO_DEST

# save mongodb backup to spesific destination
mongodump --port 27017 --authenticationDatabase "admin" --username "machinaide" --password "erste2020" --db machinaide -o $MONGO_DEST

# send mongodb backup to another server
sshpass -p "JN9TUG89BbKAen" scp -r /mongo_backups/$DIR root@173.212.226.239:/mongo_backups/


# INFLUXDB BACKUP
INFLUX_DEST=/influx_backups/$DIR
INFLUX_TOKEN=-Y8yuCS19k6ZD0FLiVvpY-zcEK4VhbBe6HC7WPKR7Z5X2bkm-Ag2iMJUSDSBOugpG6klF2XEddhCMkHRuJPbsQ==

# save influxdb backup to same server
/home/machinaide/influxdb/bin/$(uname -s | tr '[:upper:]' '[:lower:]')/influx backup $INFLUX_DEST -t $INFLUX_TOKEN

# send influxdb backup to another server
sshpass -p "JN9TUG89BbKAen" scp -r /influx_backups/$DIR root@173.212.226.239:/influx_backups/