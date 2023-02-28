const randomTextGenerator = (length) => {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export const databaseStructure = () => {
    return {
        "id": "Ermetal",
        "type": "Factory",
        "bucket": "Ermetal",
        "productionLines": [
            {
                "id": "1600T_Press_Line",
                "type": "ProductionLine",
                "machines": [
                    {
                        "id": "Press030",
                        "type": "Machine",
                        "measurements": [],
                        "components": [
                        ]
                    },
                    {
                        "id": "Press031",
                        "type": "Machine",
                        "measurements": ["Press31_DB1", "Press31_DB2"],
                        "components": [
                            {
                                "id": "anaMotor",
                                "type": "Component",
                                "sensors": [
                                    {
                                        "id": "sensor1",
                                        "type": "Sensor",
                                        "fields": ["mean_AM_Arka_Acc", "mean_AM_Arka_Balans"],
                                    },
                                    {
                                        "id": "sensor2",
                                        "type": "Sensor",
                                        "fields": ["mean_AM_Arka_Bosluk", "mean_AM_Arka_Eks_kac"],
                                    },
                                    {
                                        "id": "sensor3",
                                        "type": "Sensor",
                                        "fields": ["mean_AM_Arka_Rulman", "mean_AM_Arka_Vib"],
                                    }
                                ]
                            },
                            {
                                "id": "yaglama",
                                "type": "Component",
                                "sensors": [
                                    {
                                        "id": "yaglama_sensor1",
                                        "type": "Sensor",
                                        "fields": ["mean_Yaglama_bas_act"],
                                    },
                                    {
                                        "id": "yaglama_sensor2",
                                        "type": "Sensor",
                                        "fields": ["mean_Yaglama_sic_act"],
                                    }
                                ]
                            },
                        ]
                    },
                    {
                        "id": "Press032",
                        "type": "Machine",
                        "measurements": [],
                        "components": [
                        ]
                    },
                    {
                        "id": "Press033",
                        "type": "Machine",
                        "measurements": [],
                        "components": [
                        ]
                    },
                    {
                        "id": "Press034",
                        "type": "Machine",
                        "measurements": [],
                        "components": [
                        ]
                    },
                    {
                        "id": "Robot",
                        "type": "Machine",
                        "measurements": [],
                        "components": [
                        ]
                    },
                ]
            }
        ]
    }
}

export const cellConfiguration = (params) => {
    return {
        "x": params.xAxis ? params.xAxis : 0,
        "y": params.yAxis ? params.yAxis : 0,
        "w": params.weight ? params.weight : 6,
        "h": params.height ? params.height : 4,
        "status": "Done",
        "links": {
            "copy": "",
            "self": "",
            "view": "",
        },
        "id": randomTextGenerator(20),
        "name": params.cellName,
    }
}

export const viewConfiguration = (params) => {
    console.log("viewConfiguration", params);
    return {
        "name": params.cellName,
        "status": "Done",
        "properties": {
            "queries": [
                {
                    "name": "",
                    "text": params.query,
                    "editMode": "builder",
                    "builderConfig": {
                        "buckets": [
                            params.bucket
                        ],
                        "tags": [
                            {
                                "key": "_measurement",
                                // "values": [
                                //     "Press31_DB1"
                                // ],
                                "values": params.measurements,
                                "aggregateFunctionType": "filter"
                            },
                            {
                                "key": "_field",
                                // "values": [
                                //     "mean_Ana_hava_debi_act"
                                // ],
                                "values": params.fields,
                                "aggregateFunctionType": "filter"
                            },
                            {
                                "key": "host",
                                "values": [],
                                "aggregateFunctionType": "filter"
                            }
                        ],
                        "functions": [
                            {
                                "name": "mean"
                            }
                        ],
                        "aggregateWindow": {
                            "period": "auto",
                            "fillValues": false
                        }
                    },
                    "hidden": false
                }
            ],
            "colors": [
                {
                    "type": "scale",
                    "hex": "#31C0F6",
                    "id": "8eb8e310-864a-48e2-82f2-9973efcee3db",
                    "name": "Nineteen Eighty Four",
                    "value": 0
                },
                {
                    "type": "scale",
                    "hex": "#A500A5",
                    "id": "c7563b91-ba26-41f9-b345-f396df3ceb51",
                    "name": "Nineteen Eighty Four",
                    "value": 0
                },
                {
                    "type": "scale",
                    "hex": "#FF7E27",
                    "id": "8b53b6f8-efeb-4362-b3e2-d7dc40ac10d0",
                    "name": "Nineteen Eighty Four",
                    "value": 0
                }
            ],
            "legend": {},
            "note": "",
            "showNoteWhenEmpty": false,
            "axes": {
                "x": {
                    "bounds": [
                        "",
                        ""
                    ],
                    "label": "",
                    "prefix": "",
                    "suffix": "",
                    "base": "10",
                    "scale": "linear"
                },
                "y": {
                    "bounds": [
                        "",
                        ""
                    ],
                    "label": "",
                    "prefix": "",
                    "suffix": "",
                    "base": "10",
                    "scale": "linear"
                }
            },
            "type": "xy",
            "shape": "chronograf-v2",
            "geom": "line",
            "xColumn": "_time",
            "yColumn": "_value",
            "position": "overlaid"
        }
    }
}


export const gaugeChartConfiguration = (params) => {
    return {
        "name": params.cellName,
        "status": "Done",
        "properties": {
            "queries": [
                {
                    "name": "",
                    "text": params.query,
                    "editMode": "builder",
                    "builderConfig": {
                        "buckets": [
                            "Ermetal"
                        ],
                        "tags": [
                            {
                                "key": "_measurement",
                                "values": [
                                    "Press31_DB1"
                                ],
                                "aggregateFunctionType": "filter"
                            },
                            {
                                "key": "_field",
                                "values": [
                                    "mean_Ana_hava_debi_act"
                                ],
                                "aggregateFunctionType": "filter"
                            },
                            {
                                "key": "host",
                                "values": [],
                                "aggregateFunctionType": "filter"
                            }
                        ],
                        "functions": [
                            {
                                "name": "mean"
                            }
                        ],
                        "aggregateWindow": {
                            "period": "auto",
                            "fillValues": false
                        }
                    },
                    "hidden": false
                }
            ],
            "colors": [
                {
                    "type": "min",
                    "hex": "#00C9FF",
                    "id": "0",
                    "name": "laser",
                    "value": params.minValue,
                },
                {
                    "type": "max",
                    "hex": "#DC4E58",
                    "id": "1",
                    "name": "fire",
                    "value": params.maxValue,
                }
            ],
            "prefix": "",
            "tickPrefix": "",
            "suffix": "",
            "tickSuffix": "",
            "note": "",
            "showNoteWhenEmpty": false,
            "decimalPlaces": {
                "isEnforced": true,
                "digits": 2
            },
            "type": "gauge",
            "shape": "chronograf-v2",
            "legend": {}
        }
    }
}


export const tableChartConfiguration = (params) => {
    return {
        "name": params.cellName,
        "status": "Done",
        "properties": {
            "type": "table",
            "shape": "chronograf-v2",
            "queries": [
                {
                    "name": "",
                    "text": params.query,
                    "editMode": "advanced",
                    "builderConfig": {
                        "buckets": [
                            "Ermetal"
                        ],
                        "tags": [
                            {
                                "key": "_measurement",
                                "values": [
                                    "Press31_DB1",
                                    "Press31_DB2"
                                ],
                                "aggregateFunctionType": "filter"
                            },
                            {
                                "key": "_field",
                                "values": [
                                    "mean_AM_Arka_Acc",
                                    "mean_AM_Arka_Balans",
                                    "mean_AM_Arka_Bosluk",
                                    "mean_AM_Arka_Eks_kac"
                                ],
                                "aggregateFunctionType": "filter"
                            },
                            {
                                "key": "host",
                                "values": [],
                                "aggregateFunctionType": "filter"
                            }
                        ],
                        "functions": [
                            {
                                "name": "mean"
                            }
                        ],
                        "aggregateWindow": {
                            "period": "auto",
                            "fillValues": false
                        }
                    },
                    "hidden": false
                }
            ],
            "colors": [
                {
                    "type": "text",
                    "hex": "#ffffff",
                    "id": "base",
                    "name": "white",
                    "value": 0
                }
            ],
            "tableOptions": {
                "verticalTimeAxis": true,
                "sortBy": null,
                "fixFirstColumn": false
            },
            "fieldOptions": [
                {
                    "internalName": "_start",
                    "displayName": "_start",
                    "visible": true
                },
                {
                    "internalName": "_stop",
                    "displayName": "_stop",
                    "visible": true
                },
                {
                    "internalName": "_time",
                    "displayName": "_time",
                    "visible": true
                },
                {
                    "internalName": "_value",
                    "displayName": "_value",
                    "visible": true
                },
                {
                    "internalName": "_field",
                    "displayName": "_field",
                    "visible": true
                },
                {
                    "internalName": "_measurement",
                    "displayName": "_measurement",
                    "visible": true
                },
                {
                    "internalName": "host",
                    "displayName": "host",
                    "visible": true
                },
                {
                    "internalName": "mean_AM_Arka_Acc",
                    "displayName": "mean_AM_Arka_Acc",
                    "visible": true
                },
                {
                    "internalName": "mean_AM_Arka_Balans",
                    "displayName": "mean_AM_Arka_Balans",
                    "visible": true
                },
                {
                    "internalName": "mean_AM_Arka_Bosluk",
                    "displayName": "mean_AM_Arka_Bosluk",
                    "visible": true
                },
                {
                    "internalName": "mean_AM_Arka_Eks_kac",
                    "displayName": "mean_AM_Arka_Eks_kac",
                    "visible": true
                }
            ],
            "decimalPlaces": {
                "isEnforced": true,
                "digits": 2
            },
            "timeFormat": "YYYY-MM-DD HH:mm:ss",
            "note": "",
            "showNoteWhenEmpty": false
        }
    }
}