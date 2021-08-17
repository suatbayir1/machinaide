import AJAX from 'src/utils/ajax'

let BASE_URL = "http://localhost:9799"
let BASE_URL2 = "http://localhost:9798"

let MONGO_URL = "http://localhost:7392"
let ALERT_URL = "http://localhost:7494"

export const cancelTraining = (sessionID, modelID) => AJAX({
    url: BASE_URL + '/stop_training/' + sessionID + '/' + modelID, 
    excludeBasePath: true,
    method: 'DELETE',
})

export const startModel = async(sessionID, modelID) => {
    let url = BASE_URL + '/models/start/' + sessionID + "/" + modelID

    const response = await AJAX({
        url: url,
        excludeBasePath: true,
        method: 'POST'
    })

    if(response.data.msg === "Model started.") {
        return true
    } else {
        return false
    }
}

export const getMLinfo = async() => {
    let url = BASE_URL + '/getAllInfo'

    const response = await AJAX({
        url: url,
        excludeBasePath: true
    })

    return response.data
}

export const getMaintenanceRecords = async() => {
    let url = ALERT_URL + '/getMaintenanceRecords'

    const response = await AJAX({
        url: url,
        excludeBasePath: true
    })
    
    return response.data
} 

export const deleteMaintenanceRecord = (oid) => AJAX({
    url: ALERT_URL + '/deleteMaintenanceRecord/' + oid,
    excludeBasePath: true,
    method: 'DELETE',
    isWithCredentials: true,
})

export const rejectModel = (modelID) => AJAX({
    url: MONGO_URL + '/rejectModel/' + modelID,
    excludeBasePath: true,
    method: 'DELETE',
    isWithCredentials: true,
})

export const modelRemoval = (sessionID, modelID) => AJAX({
    url: MONGO_URL + '/modelRemoval/' + sessionID + '/' + modelID,
    excludeBasePath: true,
    method: 'DELETE',
    isWithCredentials: true,
})


// export const startModel = (sessionID, modelID) => AJAX({
//     url: BASE_URL + '/models/start/' + sessionID + '/' + modelID,
//     excludeBasePath: true,
//     method: 'POST',
//     isWithCredentials: true,
// })

export const checkModelAccepted = async (sessionID, modelID) => {
    const response = await AJAX({
        url: MONGO_URL + '/checkModelAccepted/' + sessionID + '/' + modelID,
        excludeBasePath: true
    })
    
    return response.data
}

export const getModelTypes = () => AJAX ({
    url: BASE_URL + '/models/types',
    excludeBasePath: true
})

export const getModels = async () => {
    const response = await AJAX ({
        url: BASE_URL + '/models',
        excludeBasePath: true
    })

    return response.data
}

export const issueTrainingJob = (pkg) => AJAX({
    url: BASE_URL + '/models',
    excludeBasePath: true,
    method:'POST',
    data: pkg,
})

export const issueBasicTrainingJob = (pkg, task) => AJAX({
    url: BASE_URL2 + '/basicTraining/' + task,
    excludeBasePath: true,
    method:'POST',
    data: pkg,
})


export const getCellData = async (sessionID, modelID) => {
    const response = await AJAX({
        url: MONGO_URL + '/getCellData/' + sessionID + '/' + modelID,
        excludeBasePath: true,
        method: 'GET'
    })

    return response.data
}

export const updateModelData = async (pkg) => {
    const response = await AJAX({
        url: MONGO_URL + '/updateModelData',
        excludeBasePath: true,
        method:'POST',
        data: pkg 
    })

    return response.data
}


export const deleteModel = async (modelID) => AJAX({
    url: BASE_URL + '/models/delete/' + modelID,
    excludeBasePath: true,
    method:'DELETE',
    isWithCredentials: true,
})


export const getSessions = async () => {
    const response = await AJAX({
        url: MONGO_URL + '/getSessions',
        excludeBasePath: true,
        method: 'GET',
        isWithCredentials: true
    })

    return response.data
}

export const postSession = async (sessionObj) => AJAX({
    url: MONGO_URL + '/postSession',
    excludeBasePath: true,
    method: 'POST',
    data: sessionObj,
    isWithCredentials: true
})


export const getAcceptedModels = async (sessionID) => {
    const response = await AJAX({
        url: MONGO_URL + '/getAcceptedModels/' + sessionID,
        excludeBasePath: true,
        method: 'GET',
    })

    return response.data
}


export const acceptModel = async(modelObj) => AJAX({
    url: MONGO_URL + '/acceptModel',
    excludeBasePath: true,
    method: 'POST',
    data: modelObj,
    isWithCredentials: true,
})


export const getCellCount = async (sessionID) => {
    const response = await AJAX({
        url: MONGO_URL + '/getCellCount/' + sessionID,
        excludeBasePath: true,
        method: 'GET'
    })
    console.log(response.data, "index")

    return response.data
}

export const getBasicModels = async () => {
    const response = await AJAX({
        url: MONGO_URL + '/getBasicModels',
        excludeBasePath: true,
        method: 'GET'
    })

    return response.data
}

export const basicRun = async (modelID) => {
    const response = await AJAX({
        url: BASE_URL2 + '/basicRun/' + modelID,
        excludeBasePath: true,
        method: 'POST'
    })
}

export const getBasicCell = async (modelID) => AJAX({
    url: MONGO_URL + '/getBasicCell/' + modelID,
    excludeBasePath: true,
    method: 'GET' 
})

export const trainModel = (modelId) => AJAX ({
    url: BASE_URL + '/jobs/train/' + modelId,
    excludeBasePath: true,
    method: 'POST'
})

export const postModel = async (model) => {
    const response = await AJAX ({
        url: BASE_URL + '/models',
        excludeBasePath: true,
        method: 'POST',
        data: model
    })

    return response.data
}

export const cancelDetection = (modelId) => AJAX({
    url: BASE_URL + '/jobs/detect/cancel/' + modelId,
    excludeBasePath: true,
    method: 'POST'  
})

export const getParams = () => AJAX({
    url: BASE_URL + '/params',
    excludeBasePath: true
})

export const getMetrics = () => AJAX({
    url: BASE_URL + '/metrics',
    excludeBasePath: true
})

export const getTrainingProgress = (modelId) => AJAX({
    url: BASE_URL + '/train_progress/' + modelId,
    excludeBasePath: true
})