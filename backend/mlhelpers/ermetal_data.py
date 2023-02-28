from mlhelpers.mlutils import MLPreprocessor, Influx2QueryHelper
from config import INFLUX

    
    
measurement_sensor_dict = {
    "Pres31-DB1": ["AM_rpm_act", "Ana_hava_debi_act", "Ana_hava_sic_act", "Bit_control", "Deng_hava_bas_act",
                   "Deng_hava_debi_act", "Deng_hava_sic_act", "Frn_grup_sic_act", "Hid_emn_bas_act", "Kalip_no",
                   "Kavr_hava_debi_act", "Kavr_hava_sic_act", "Koc_ton_act", "Reg_poz_act", "Rob_ctr_sic_act",
                   "Robot_hava_debi_act", "Robot_hava_sic_act", "Yaglama_bas_act", "Yaglama_sic_act", "Yedek1", "Yedek2"]
}
    
helper = Influx2QueryHelper({"host": "localhost", "port": 8080, "db": "Ermetal", "rp": "autogen"})

raw_data, sensor_names = helper.query(measurement_sensor_dict, "2022-12-25T20:15:02.468Z", "2022-12-29T20:15:01.468Z")

processor = MLPreprocessor(raw_data)

df = processor.preproc("df", sensor_names)
print(df.head())
df.to_csv("/home/machinaide/project/machinaide/backend/data_2022-12-25T20-15-02_2022-12-29T20-15-01.csv")
print("over")
