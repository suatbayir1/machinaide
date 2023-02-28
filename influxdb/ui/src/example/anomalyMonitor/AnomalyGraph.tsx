import React, {MouseEvent} from 'react'
import {ResponsiveLine} from '@nivo/line'

interface Props {
    onClick:  (point: any, event: any) => void
}

class AnomalyLine extends React.Component<Props>{
    render() {
        return(
            <ResponsiveLine
                data={data}
                onClick={this.props.onClick}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
                yFormat=" >-.2f"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'transportation',
                    legendOffset: 36,
                    legendPosition: 'middle'
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'count',
                    legendOffset: -40,
                    legendPosition: 'middle'
                }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                markers={[
                  {
                    axis: 'x',
                    value: data[0].data[5].x,
                    lineStyle: { stroke: '#b0413e', strokeWidth: 2 },
                    legend: 'x marker',
                  },
                ]}
                /* tooltip={(point) => {
                  return (
                      <div
                          style={{
                              background: 'white',
                              padding: '9px 12px',
                              border: '1px solid #ccc',
                          }}
                      >
                          <div>x: {point.point}</div>
                          
                      </div>
                  )
                }} */
                legends={[
                    {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemBackground: 'rgba(0, 0, 0, .03)',
                                    itemOpacity: 1
                                }
                            }
                        ]
                    }
                ]}
            />
        )
    }
}

export default AnomalyLine

const data = [
    {
      "id": "japan",
      "color": "hsl(285, 70%, 50%)",
      "data": [
        {
          "x": "plane",
          "y": 189
        },
        {
          "x": "helicopter",
          "y": 12
        },
        {
          "x": "boat",
          "y": 65
        },
        {
          "x": "train",
          "y": 219
        },
        {
          "x": "subway",
          "y": 263
        },
        {
          "x": "bus",
          "y": 158
        },
        {
          "x": "car",
          "y": 247
        },
        {
          "x": "moto",
          "y": 10
        },
        {
          "x": "bicycle",
          "y": 128
        },
        {
          "x": "horse",
          "y": 15
        },
        {
          "x": "skateboard",
          "y": 131
        },
        {
          "x": "others",
          "y": 144
        }
      ]
    },
    {
      "id": "france",
      "color": "hsl(72, 70%, 50%)",
      "data": [
        {
          "x": "plane",
          "y": 210
        },
        {
          "x": "helicopter",
          "y": 61
        },
        {
          "x": "boat",
          "y": 198
        },
        {
          "x": "train",
          "y": 126
        },
        {
          "x": "subway",
          "y": 147
        },
        {
          "x": "bus",
          "y": 261
        },
        {
          "x": "car",
          "y": 182
        },
        {
          "x": "moto",
          "y": 203
        },
        {
          "x": "bicycle",
          "y": 246
        },
        {
          "x": "horse",
          "y": 67
        },
        {
          "x": "skateboard",
          "y": 156
        },
        {
          "x": "others",
          "y": 201
        }
      ]
    },
    {
      "id": "us",
      "color": "hsl(358, 70%, 50%)",
      "data": [
        {
          "x": "plane",
          "y": 217
        },
        {
          "x": "helicopter",
          "y": 109
        },
        {
          "x": "boat",
          "y": 168
        },
        {
          "x": "train",
          "y": 78
        },
        {
          "x": "subway",
          "y": 24
        },
        {
          "x": "bus",
          "y": 65
        },
        {
          "x": "car",
          "y": 25
        },
        {
          "x": "moto",
          "y": 99
        },
        {
          "x": "bicycle",
          "y": 273
        },
        {
          "x": "horse",
          "y": 0
        },
        {
          "x": "skateboard",
          "y": 121
        },
        {
          "x": "others",
          "y": 255
        }
      ]
    },
    {
      "id": "germany",
      "color": "hsl(44, 70%, 50%)",
      "data": [
        {
          "x": "plane",
          "y": 171
        },
        {
          "x": "helicopter",
          "y": 193
        },
        {
          "x": "boat",
          "y": 174
        },
        {
          "x": "train",
          "y": 56
        },
        {
          "x": "subway",
          "y": 107
        },
        {
          "x": "bus",
          "y": 190
        },
        {
          "x": "car",
          "y": 168
        },
        {
          "x": "moto",
          "y": 128
        },
        {
          "x": "bicycle",
          "y": 266
        },
        {
          "x": "horse",
          "y": 186
        },
        {
          "x": "skateboard",
          "y": 48
        },
        {
          "x": "others",
          "y": 12
        }
      ]
    },
    {
      "id": "norway",
      "color": "hsl(271, 70%, 50%)",
      "data": [
        {
          "x": "plane",
          "y": 34
        },
        {
          "x": "helicopter",
          "y": 245
        },
        {
          "x": "boat",
          "y": 208
        },
        {
          "x": "train",
          "y": 123
        },
        {
          "x": "subway",
          "y": 197
        },
        {
          "x": "bus",
          "y": 63
        },
        {
          "x": "car",
          "y": 261
        },
        {
          "x": "moto",
          "y": 136
        },
        {
          "x": "bicycle",
          "y": 110
        },
        {
          "x": "horse",
          "y": 149
        },
        {
          "x": "skateboard",
          "y": 112
        },
        {
          "x": "others",
          "y": 203
        }
      ]
    }
  ]