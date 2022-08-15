export const tipStyle = {
    borderStyle: 'none none solid none',
    borderWidth: '2px',
    borderColor: '#BE2EE4',
    boxShadow: '0 0 5px 0 #8E1FC3',
    margin: '3px'
}

export const addNewNodeHeader = `This window was created to add a new digital twin object to the system. You need to fill in the form completely by clicking the 
 - factory button to add a factory,
 - production line button to add a production line,
 - machine button to add a machine, 
 - component button to add a component and 
 - sensor button to add a sensor
 - field button to add a field.`

export const addNewMachine = `To add a new machine, you must first select the production line you want to add from the dropdown menu on the left. Then you can add a unique name and optionally a description of the machine you will add.`

export const addNewComponent = `To add a new component, 
- You must first select the machine you want to add from the dropdown menu on left. 
- Then you can add a unique name and optionally a description of the component you will add. 
- Lastly, you should select the 3D visual information corresponding to the component you will add through the visual list.`

export const addNewSensor = `To add a new sensor, 
- You must first select the component you want to add from the dropdown menu on left. 
- Next, you must fill in the fields in the rest of the form for the sensor you will add. 
- Lastly, you should select the 3D visual information corresponding to the sensor you will add through the visual list.`

export const sensorType = `Indicates which type of measurement the sensor to be added makes. For example, it could be temperature, vibration, pressure or airflow.`

export const sensorUnit = `Indicates the data type of the measurements made by the sensor to be added. For example, it can be float, integer, double, bit, or real.`

export const sensorDataSource = `It allows us to choose which channel the measurement data of the sensor will come from.`

export const addFieldToSensor = `Some sensors can make more than one measurement. You can determine how many measurements the sensor you will add and the lower and upper limits of each measurement will be using the form below`

export const dtMonitorPage = `This page is the screen where the digital twins are watched. The page generally consists of 3 parts. The pane on the left of the screen contains general information about the factory and information about the currently selected digital twin. In the middle there is a graph showing the hierarchy of digital twins and a section where users can write their queries. On the right side of the screen, there is a 3D representation of the digital twins.`

export const showAllSensorValues = `If this control element is activated, the last measurement values of all sensors in the system will appear in the graph in the middle.`

export const updateSensor = `After changing the relevant fields in the form above, the lower and upper limit values of the field can be changed by pressing the update button.`

export const textToQuery = `You can query by typing or voice by using the text box and buttons on the side.
 - After typing your query in your text box, you can query by pressing the search button.
 - After pressing the play button, you can say your query out loud and press the pause button.`

export const dtManagementPage = `On the digital twin management page, 3D visual information is created to represent the digital twins. The screen generally consists of 2 parts. On the left part of the screen, properties such as color and transparency of an object selected on the scene can be changed. On the right side of the screen, visual information about the digital twin added to the scene is displayed. By selecting any object, information such as position, rotation and depth can be adjusted.`

export const objectOpacity = `Float in the range of 0.0 - 1.0 indicating how transparent the material is. A value of 0.0 indicates fully transparent, 1.0 is fully opaque`

export const objectTexture = `Allows to add a previously loaded texture to a selected geometric shape. First, select an object on the scene and then select the texture you want and press the update button.`

export const objectUpdateRemove = ` - After changing the properties of an object, you must press the update button to save the changes.
 - To delete an object, you must first select an object from the scene and then press the remove button.`

export const objectSelectDT = `By means of the button on the side, the digital twin to be worked with is selected and the 3D view of that digital twin is displayed on the stage.`

export const addTexture = `You can add a texture that you have prepared for later use to the system through this window. After selecting the texture from the relevant location, you need to assign a unique name.`

export const objectImportComponent = `In the list below, there is a list of previously saved 3D visual information. You need to select the element with the name you want to add to the scene and press the import button.`

export const objectSaveAndSaveAs = `There are 2 options to add the 3D visual objects you have created to the system;
 - Save is used the first time you create and want to save.
 - Save as is used when you want to save changes that you have created and made later.`

export const factoryPage = `This page contains accessible shortcuts about the factory. The page generally consists of 2 parts. On the left, there are shortcuts to access the data in the factory, on the right, there is a list of production lines and summary information.`

export const productionLinePage = `This page contains summary information and images about the production line.`

export const productionLineDataFlow = `The graph below represents the machines in the production line and the data flow between the machines.`

export const backup = `On this page, a backup of the data between the desired dates can be taken. 
 - First, select the start and end dates to backup.
 - Then choose which data you want to backup and hit export`

export const reportDetails = `When creating a new report;
 - Author, who created the report,
 - Report Title, what the report title will be,
 - Repeat, how often the report will be generated
 - Schedule report as, you need to enter the first report generation time.`

export const selectTargetAndOptions = `It determines which part's data will be retrieved while generating the report. If you select the component part as ALL, the data of all the components belonging to the selected machine are taken or you can choose to import a single component data`

export const emailConfiguration = `After the report is created, you can send the report as an e-mail to the email addresses you want. To send an e-mail, you must fill out the form below.`

export const selectEmailTo = `You can add multiple email addresses using the side element. To add a new email address, you can press "space" or "enter" after typing a correct email address.`

export const cloudConfiguration = `If you have an account in the cloud environment. You can store reports here. (Note: This option is still under development)`

export const reportEnable = `By using the control button on the side, you can cancel the creation of previously created reports and sending them via e-mail. (Note: disabling the button does not delete the report configurations)`

export const dataFlowSettings = `This page determines the direction of data communication between machines. 
 - Source is from which machine the data is received, and 
 - Target is which machine the data is sent to.`

export const machinesPanel = `The list of machines is shown on the cards on this page. When you hover over any card, shortcut keys related to that machine appear. You can access the sub-pages by means of the relevant keys.`

export const componentsPanel = `The list of components is shown on the cards on this page. When you hover over any card, shortcut keys related to that component appear. You can access the sub-pages by means of the relevant keys.`

export const sensors = `This page contains information about the sensors in the selected component. Alerts and dashboards of sensors can be seen through the buttons at the end of the table.`

export const failureAlarmScene = `In this scene, it is visually seen which parts of the digital twins have malfunctions. 
 - First of all, which digital twin will be displayed is selected by the button on the left.
 - After the selection is made, if there has been a malfunction on the digital twin before, they will appear.
 - If you just want to see the list of errors on the part you want. please right click on the part you want on the scene`

export const failureTimerange = `Faults occurring between two dates selected by the calendar on the side are displayed.`

export const bucketConfirmationText = 'You want to change the bucket information of the selected factory. If you change the bucket information, the measurement and field settings related to the machine and sensors inside the factory may be corrupted and you may need to set them again. Please confirm if you want to continue processing.'
export const deleteFactoryConfirmationText = 'You want to delete the selected factory. It can be production line, machine, component and sensor registration attached to the factory. If you delete the factory record, you will also lose this information. Do you want to continue?'
export const deleteProductionLineConfirmationText = 'You want to delete the selected production line. It can be machine, component and sensor registration attached to the production line. If you delete the production line record, you will also lose this information. Do you want to continue?'
export const updateMachineConfirmationText = 'You want to change the measurements of the selected machine. If you change the measurements, the field settings related to the sensors inside the factory may be corrupted and you may need to set them again. Please confirm if you want to continue proccessing.'
export const deleteMachineConfirmationText = 'You want to delete the selected machine. It can be component and sensor registration attached to the machine. If you delete machine record, you will also lose this information. Do you want to continue?'
export const deleteComponentConfirmationText = 'You want to delete the selected component. It can be sensor registration attached to the component. If you delete component record, you will also lose this information. Do you want to continue?'
export const deleteSensorConfirmationText = 'You want to delete the selected sensor. It can be field registration attached to the sensor. If you delete sensor record, you will also lose this information. Do you want to continue?'
export const updateFieldConfirmationText = 'You want to change the measurement and data source of the selected field. If you change the measurement and data source, there may be distortions in the relevant places you have previously set and you may need to change them again. Do you want to continue?'
export const deleteFieldConfirmationText = 'You want to delete the selected field. If you delete field record, you will also lose the associated information. Do you want to continue?'