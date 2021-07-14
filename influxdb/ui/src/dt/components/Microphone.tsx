import React, { PureComponent } from 'react'

import {
    Button, ButtonType, ComponentColor, IconFont,
} from '@influxdata/clockface'

var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
var recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = true;
recognition.maxAlternatives = 5;

interface State {
    isSpeaking: boolean
    predictiveSentences: object[]
}
interface Props {
    getTextQuery: (text) => void
    getSpeechRecognitionAlternatives: (alternatives) => void
}

export default class Microphone extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            isSpeaking: false,
            predictiveSentences: [],
        }
    }

    componentDidMount() {
        let vm = this;

        recognition.onresult = function (event) {
            var current = event.resultIndex;
            var transcript = event.results[current][0].transcript;
            vm.setState({ predictiveSentences: event.results[current] })
            vm.props.getTextQuery(transcript);
        };

        recognition.onstart = function () {
            console.log('Voice recognition is ON.');
        }

        recognition.onspeechend = function () {
            vm.setState({ isSpeaking: false });
            recognition.stop();
        }

        recognition.onerror = function (event) {
            if (event.error == 'no-speech') {
                console.log('Try again.');
            }
        }
    }

    start = () => {
        recognition.start();
        this.setState({ isSpeaking: true });
    }

    stop = () => {
        const { predictiveSentences } = this.state;

        recognition.stop();
        this.setState({ isSpeaking: false });
        this.props.getSpeechRecognitionAlternatives(predictiveSentences);
    }

    render() {
        const { isSpeaking } = this.state;

        return (
            <>
                {
                    !isSpeaking &&
                    <Button
                        text=""
                        onClick={this.start}
                        type={ButtonType.Button}
                        icon={IconFont.Play}
                        color={ComponentColor.Success}
                    />
                }
                {
                    isSpeaking &&
                    <Button
                        text=""
                        onClick={this.stop}
                        type={ButtonType.Button}
                        icon={IconFont.Pause}
                        color={ComponentColor.Danger}
                    />
                }
            </>
        )
    }
}





















// // Libraries
// import React from 'react';
// import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// // Components
// import {
//     Button, ButtonType, ComponentColor, IconFont,
// } from '@influxdata/clockface'

// const Microphone = ({ getTextQuery }) => {
//     const {
//         transcript,
//         listening,
//         browserSupportsSpeechRecognition,
//     } = useSpeechRecognition();

//     if (listening) {
//         getTextQuery(transcript);
//     }


//     if (!browserSupportsSpeechRecognition) {
//         return <span>Browser doesn't support speech recognition.</span>;
//     }

//     if (!listening) {
//         return (
//             <Button
//                 text=""
//                 onClick={() => { SpeechRecognition.startListening({ language: 'en-US' }) }}
//                 type={ButtonType.Button}
//                 icon={IconFont.Play}
//                 color={ComponentColor.Success}
//             />
//         );
//     } else {
//         return (
//             <Button
//                 text=""
//                 onClick={() => { SpeechRecognition.stopListening() }}
//                 type={ButtonType.Button}
//                 icon={IconFont.Pause}
//                 color={ComponentColor.Danger}
//             />
//         )
//     }

// };
// export default Microphone;