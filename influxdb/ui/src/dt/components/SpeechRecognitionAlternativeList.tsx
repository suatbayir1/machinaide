// Libraries
import React, { PureComponent } from 'react'

// Components
import {
    Grid, Overlay, Gradients, List, Button, IconFont, ComponentColor, ButtonType,
} from '@influxdata/clockface'

interface State {
    selectedAlternative: string
}
interface Props {
    visible: boolean
    dismiss: () => void
    speechRecognitionAlternatives: object[]
    handleSelectAlternative: (alternative) => void
}

class SpeechRecognitionAlternativeList extends PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            selectedAlternative: "",
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.speechRecognitionAlternatives !== this.props.speechRecognitionAlternatives) {
            if (this.props.speechRecognitionAlternatives[0] !== undefined) {
                this.setState({ selectedAlternative: this.props.speechRecognitionAlternatives[0]["transcript"] });
            }
        }
    }

    render() {
        const { speechRecognitionAlternatives } = this.props
        return (
            <Overlay visible={this.props.visible}>
                <Overlay.Container maxWidth={750} style={{ minHeight: "300px" }}>
                    <Overlay.Header
                        title="Speech Recognition Alternatives"
                        onDismiss={this.props.dismiss}
                    />
                    <Overlay.Body>
                        <Grid>
                            <Grid.Row>
                                <div style={{ marginBottom: '20px' }}>Please select the text closest to your question from the list below</div>
                            </Grid.Row>
                            <Grid.Row>
                                <List>
                                    {
                                        Object.keys(speechRecognitionAlternatives).map((alternative, idx) => (
                                            <List.Item
                                                key={idx}
                                                value={speechRecognitionAlternatives[alternative].transcript}
                                                onClick={() => this.setState({ selectedAlternative: speechRecognitionAlternatives[alternative].transcript })}
                                                selected={this.state.selectedAlternative === speechRecognitionAlternatives[alternative].transcript}
                                                title={speechRecognitionAlternatives[alternative].transcript}
                                                gradient={Gradients.GundamPilot}
                                                wrapText={true}
                                            >
                                                <List.Indicator type="dot" />
                                                <div className="selectors--item-name">{speechRecognitionAlternatives[alternative].transcript}</div>
                                                <div className="selectors--item-type">{speechRecognitionAlternatives[alternative].score}</div>
                                            </List.Item>
                                        ))
                                    }
                                </List>
                            </Grid.Row>
                        </Grid>
                    </Overlay.Body>

                    <Overlay.Footer>
                        <Button
                            text="OK"
                            icon={IconFont.Checkmark}
                            color={ComponentColor.Success}
                            type={ButtonType.Submit}
                            onClick={() => { this.props.handleSelectAlternative(this.state.selectedAlternative) }}
                        />
                    </Overlay.Footer>
                </Overlay.Container>
            </Overlay >
        )
    }
}

export default SpeechRecognitionAlternativeList;