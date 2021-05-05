#!/bin/sh
DIR=`date +%m%d%y`
DEST=/influx_backups/$DIR
INFLUX_TOKEN=-Y8yuCS19k6ZD0FLiVvpY-zcEK4VhbBe6HC7WPKR7Z5X2bkm-Ag2iMJUSDSBOugpG6klF2XEddhCMkHRuJPbsQ==

# save mongodb backup to same server
/home/machinaide/influxdb/bin/$(uname -s | tr '[:upper:]' '[:lower:]')/influx backup $DEST -t $INFLUX_TOKEN

# send mongodb backup to another server
sshpass -p "JN9TUG89BbKAen" scp -r /influx_backups/$DIR root@173.212.226.239:/influx_backups/