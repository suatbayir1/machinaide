from mlutils import Influx2QueryHelper
from influxdb_client import InfluxDBClient 
from config import INFLUXDB_CLIENT, INFLUX

org = "machinaide"
token = "-Y8yuCS19k6ZD0FLiVvpY-zcEK4VhbBe6HC7WPKR7Z5X2bkm-Ag2iMJUSDSBOugpG6klF2XEddhCMkHRuJPbsQ=="
read_token = "JlPjqoeepWPKtrkQNy2jtMQFYtFdtodIsJMg3AsMgotQAbKz4ZjZA2CikIF_B52SA3M4BUgU91adFgqjH7Nd4Q=="

influxdb = InfluxDBClient(url=INFLUX["host"], token=INFLUX["dbtoken"], org=INFLUX["orgID"], verify_ssl=False)

# helper = Influx2QueryHelper({"host": "localhost", "port": "8080", "db": "Ermetal", "rp": "autogen"})
query_api = influxdb.query_api()
res = query_api.query("""from(bucket: "Ermetal")
  |> range(start: -5m)
  |> filter(fn: (r) => r["_measurement"] == "Pres31-DB1")
  |> filter(fn: (r) => r["_field"] == "AM_rpm_act")
  |> aggregateWindow(every: 5s, fn: mean, createEmpty: false)
  |> yield(name: "mean")""")

print(res)

for table in res:
    print(table)
    for row in table.records:
        print (row.values)