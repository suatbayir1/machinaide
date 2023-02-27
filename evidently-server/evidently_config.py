MONGO = dict(
    MONGO_URI = "mongodb://machinaide:erste2020@localhost:27017/",
    DATABASE = "machinaide"
)

INFLUX = dict(
    host = "http://127.0.0.1:8080",#'https://vmi474601.contaboserver.net:8086',
    orgID = "7566715625c95d64",# 'd572bde16b31757c',
    dbtoken = "KpDT_gr1Z5YAXrE3WMWpZyvmBT2RtM8KJEU6GSz_MPGKB9zI7Foul5WUfRBSpTpRnG05QqidGRq_PMRp_StMEg==" # "FlviKxQ-RHHWxd1FRkHIc5VwNZuFnP6QTmsJcU6GI7nrd4cuqaTx3cCijZchENMH0zSGuKOew_e4LxW6V09Erw=="
)

ADD_REPORT_URL = f"http://localhost:6161/addReport"