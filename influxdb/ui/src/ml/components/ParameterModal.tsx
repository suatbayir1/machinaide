import React from 'react';
// import Button from '@material-ui/core/Button';
import { Button, ButtonType, ComponentColor, IconFont } from '@influxdata/clockface'
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import ButtonGroup from '@material-ui/core/ButtonGroup'
// import styled from 'styled-components'

// const Tab = styled.button`
//   font-size: 20px;
//   padding: 10px 60px;
//   cursor: pointer;
//   opacity: 0.6;
//   background: white;
//   border: 0;
//   outline: 0;
//   ${({ active }) =>
//     active &&
//     `
//     border-bottom: 2px solid black;
//     opacity: 1;
//   `}
// `;

// const types = ['Parameters', 'Class Specifics'];


export default function TabGroup(tabinfo) {
  let algs = tabinfo.tabinfo.info.Algorithms
  console.log(tabinfo, "hey")
  // if (tabinfo.tabinfo.selectedClass === 'ALL') {
  //   Object.keys(tabinfo.tabinfo.info.Classes).forEach(key => {
  //     tabinfo.tabinfo.info.Classes[key].forEach(alg => {
  //       algs.push(alg)
  //     })
  //   })
  // } else {
  //   algs = tabinfo.tabinfo.info.Classes[tabinfo.tabinfo.selectedClass]
  // }
//   const [active, setActive] = React.useState(types[0]);
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button text="Parameters" icon={IconFont.CogThick} color={ComponentColor.Secondary} onClick={handleClickOpen} type={ButtonType.Button}/>
        <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
          <DialogTitle id="form-dialog-title">Model Specific Parameters</DialogTitle>
          <DialogContent>
            {/* <ButtonGroup>
              {types.map(type => (
                <Tab
                  key={type}
                  active={active === type}
                  onClick={() => setActive(type)}
                >
                  {type}
                </Tab>
              ))}
            </ButtonGroup>
            <p /> */}
            <div>
              {/* {active === types[0] ? ( */}
                <FormDialog forminfo={{info: tabinfo.tabinfo.info, algs: algs}}/>
                  {/* <div>
                    <p>{`Selected Algorithm Class: ${tabinfo.tabinfo.selectedClass}`}</p>
                  </div> */}
            </div>
          </DialogContent>
          <DialogActions>
            {/* <Button onClick={handleClose} color={ComponentColor.Danger} text="Cancel">
            </Button> */}
            <Button onClick={handleClose} color={ComponentColor.Primary} text="Set Parameters">
            </Button>
          </DialogActions>
      </Dialog>
    </div>
  );
}

function FormDialog(forminfo) {
  const [selectedAlgorithm, chooseAlgorithm] = React.useState("")
  const [update, setUpdate] = React.useState(0)

  const handleAlgorithmChoose = (e) => {
    chooseAlgorithm(e.target.value)
  }

  const handleValueChoose = (e) => {
    forminfo.forminfo.info.Parameters[selectedAlgorithm][e.target.name].Value = e.target.value
    setUpdate((update + 1) % 10)
  }
  
  return (
    <div>
        <div>
            <InputLabel id="alg-label">Algorithm</InputLabel>
            <Select
                fullWidth
                labelId="alg-label"
                name="algorithm"
                onChange={handleAlgorithmChoose}
                children={Object.keys(forminfo.forminfo.info.Parameters).map(alg => {return (<MenuItem value={alg}>{alg}</MenuItem>)})}
                value={selectedAlgorithm}
                />
        </div>
        {selectedAlgorithm !== "" ? (
          Object.keys(forminfo.forminfo.info.Parameters[selectedAlgorithm]).map((param) => {
            if(forminfo.forminfo.info.Parameters[selectedAlgorithm][param].Type === "Dropdown") {
                return (
                    <div style={{marginTop: 10}}>
                        <InputLabel id={param}>{param}</InputLabel>
                        <Select
                            fullWidth
                            name={param}
                            labelId={param}
                            onChange={handleValueChoose}
                            value={forminfo.forminfo.info.Parameters[selectedAlgorithm][param].Value}
                            children={forminfo.forminfo.info.Parameters[selectedAlgorithm][param].Items.map(val => {return (<MenuItem value={val}>{val}</MenuItem>)})}/>
                        
                    </div>
                )
            } else if(forminfo.forminfo.info.Parameters[selectedAlgorithm][param].Type === "Number") {
                return (
                  <div style={{marginTop: 10}}>
                    <TextField
                    autoFocus
                    margin="dense"
                    id={param}
                    label={param}
                    name={param}
                    value={forminfo.forminfo.info.Parameters[selectedAlgorithm][param].Value}
                    type="number"
                    onChange={handleValueChoose}
                    fullWidth/>
                  </div>
                )
            } else if(forminfo.forminfo.info.Parameters[selectedAlgorithm][param].Type === "Text") {
                return (
                  <div style={{marginTop: 10}}>
                    <TextField
                    autoFocus
                    margin="dense"
                    id={param}
                    label={param}
                    name={param}
                    type="text"
                    value={forminfo.forminfo.info.Parameters[selectedAlgorithm][param].Value}
                    onChange={handleValueChoose}
                    fullWidth/>
                  </div>
                )
            }
          })
        ) : (
          <div>
            <p>Select an algorithm</p>
          </div>
        )
        }
    </div>
  );
}