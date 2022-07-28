import React, { PureComponent } from 'react'

import {
    Button, ButtonType, ComponentColor, IconFont,
} from '@influxdata/clockface'

var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
var recognition = new SpeechRecognition();
var speechRecognitionList = new SpeechGrammarList();
var colors = ['aqua', 'azure', 'beige', 'bisque', 'black', 'blue', 'brown', 'chocolate', 'coral', 'crimson', 'cyan', 'fuchsia', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'indigo', 'ivory', 'khaki', 'lavender', 'lime', 'linen', 'magenta', 'maroon', 'moccasin', 'navy', 'olive', 'orange', 'orchid', 'peru', 'pink', 'plum', 'purple', 'red', 'salmon', 'sienna', 'silver', 'snow', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'white', 'yellow'];
var grammar = '#JSGF V1.0; grammar colors; public <color> = ' + colors.join(' | ') + ' ;'

speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = true;
recognition.maxAlternatives = 5;

interface State {
    isSpeaking: boolean
    predictiveSentences: object[]
    lastSentence: string
}
interface Props {
    getTextQuery: (text) => void
    getSpeechRecognitionAlternatives: (alternatives, lastSentence) => void
}

export default class Microphone extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            isSpeaking: false,
            predictiveSentences: [],
            lastSentence: "",
        }
    }

    componentDidMount() {
        let vm = this;

        recognition.onresult = function (event) {
            console.log(event);
            var current = event.resultIndex;
            var transcript = event.results[current][0].transcript;
            vm.setState({ predictiveSentences: event.results[current], lastSentence: transcript })
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
        const { predictiveSentences, lastSentence } = this.state;

        console.log({ lastSentence })

        recognition.stop();
        this.setState({ isSpeaking: false });
        this.props.getSpeechRecognitionAlternatives(predictiveSentences, lastSentence);
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