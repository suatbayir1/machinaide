import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

// export default function FormDialog() {
const FormDialog = (props) => {

    const { open, setOpen, data } = props

    //Report Configuration States
    const [reportTitle, setReportTitle] = React.useState('')
    //Checboxes, Cloud and Email Configuration States
    const [checkboxes, setChecBoxConfig] = React.useState({
        sendEmail: false,
        xlsx: false,
        csv: false,
    });

    const [email, setEmail] = React.useState('')

    //State Handlers
    const handleReportTitle = (event) => {
        setReportTitle(event.target.value);
    };

    const handleCheckBox = (event) => {
        setChecBoxConfig({ ...checkboxes, [event.target.name]: event.target.checked })
    }

    const handleEmail = (event) => {
        setEmail(event.target.value)
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        const params = {
            title: reportTitle,
            CheckBox: checkboxes,
            email: email,
            reportData: data,
        }

        console.log(params)
        console.log(JSON.stringify(params))

    }

    return (
        <div>
            <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Report Configuration</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Enter Configuration Details in the sections provided
          </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="saveReportAs"
                        name="title"
                        label="Report Title"
                        onInput={handleReportTitle}
                        fullWidth
                    />
                    <FormControlLabel
                        control={<Checkbox color="secondary" name="xlsx" value="yes" onChange={handleCheckBox} />}
                        label=".xlsx Report"
                    />
                    <FormControlLabel
                        control={<Checkbox color="secondary" name="csv" value="yes" onChange={handleCheckBox} />}
                        label=".csv Report"
                    />
                    <FormControlLabel
                        control={<Checkbox color="secondary" name="sendEmail" value="yes" onChange={handleCheckBox} />}
                        label="Send Report as Email"
                    />
                    <TextField
                        id="email"
                        name="email"
                        label="Enter Your Email Address"
                        type="email"
                        onInput={handleEmail}
                        fullWidth
                        disabled={!(checkboxes.sendEmail)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="primary">
                        Cancel
          </Button>
                    <Button onClick={handleSubmit} color="primary">
                        Confirm
          </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default FormDialog;