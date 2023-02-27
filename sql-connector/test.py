import mysql.connector
from mysql.connector import Error
connection = None
try:
    connection = mysql.connector.connect(host='10.16.5.2',
                                         port='1433',
                                         database='MNADE',
                                         user='iotiq',
                                         password='1TT1ja/AzSMu9XCC')
    print("here")
    print(connection)
    if(connection.is_connected()):
        db_Info = connection.get_server_info()
        print("Connected to MySQL Server version ", db_Info)
        cursor = connection.cursor()
        cursor.execute("select database();")
        record = cursor.fetchone()
        print("You're connected to database: ", record)

except Error as e:
    print("Error while connecting to MySQL", e)
finally:
    if connection.is_connected():
        cursor.close()
        connection.close()
        print("MySQL connection is closed")
