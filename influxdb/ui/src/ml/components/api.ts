import { BACKEND } from 'src/config';

import AJAX from 'src/utils/ajax'


let BASE_URL = "http://localhost:9632/api/v1.0/ml"
let BASE_URL2 = "http://localhost:9632/api/v1.0/ml"

// let MONGO_URL = "http://localhost:7393"
let MONGO_URL = "http://localhost:9632/api/v1.0/metadata"
let ALERT_URL = "http://localhost:9632"
let HPC_URL = "http://localhost:9632/api/v1.0/hpc"


export const createTask = async(pkg) => {
    let url = BASE_URL + '/createTask'

    const response = await AJAX({
        url: url,
        method: 'POST',
        data: pkg
    })

    console.log(response.statusText)
}

export const getTasks = async () => {
    let url = BASE_URL + '/getTasks'

    const response = await AJAX({
        url: url,
        method: 'GET'
    })

    return response.data
} 


export const cancelTraining = (sessionID, modelID) => AJAX({
    url: BASE_URL + '/stop_training/' + sessionID + '/' + modelID,
    //excludeBasePath: true,
    method: 'DELETE',
})

export const startModel = async (sessionID, modelID) => {
    let url = BASE_URL + '/models/start/' + sessionID + "/" + modelID

    const response = await AJAX({
        url: url,
        ////excludeBasePath: true,
        method: 'POST'
    })

    if (response.data.msg === "Model started.") {
        return true
    } else {
        return false
    }
}

export const getMLinfo = async () => {
    let url = BASE_URL + '/getAllInfo'

    const response = await AJAX({
        url: url,
        //excludeBasePath: true
    })

    return response.data
}

export const getMaintenanceRecords = async () => {
    let url = ALERT_URL + '/getMaintenanceRecords'

    const response = await AJAX({
        url: url,
        //excludeBasePath: true
    })

    return response.data
}

export const deleteMaintenanceRecord = (oid) => AJAX({
    url: ALERT_URL + '/deleteMaintenanceRecord/' + oid,
    //excludeBasePath: true,
    method: 'DELETE',
    //isWithCredentials: true,
})

export const rejectModel = (modelID) => AJAX({
    url: MONGO_URL + '/rejectModel/' + modelID,
    //excludeBasePath: true,
    method: 'DELETE',
    //isWithCredentials: true,
})

export const modelRemoval = (sessionID, modelID) => AJAX({
    url: MONGO_URL + '/modelRemoval/' + sessionID + '/' + modelID,
    //excludeBasePath: true,
    method: 'DELETE',
    //isWithCredentials: true,
})


// export const startModel = (sessionID, modelID) => AJAX({
//     url: BASE_URL + '/models/start/' + sessionID + '/' + modelID,
//     //excludeBasePath: true,
//     method: 'POST',
//     //isWithCredentials: true,
// })

export const checkModelAccepted = async (sessionID, modelID) => {
    const response = await AJAX({
        url: MONGO_URL + '/checkModelAccepted/' + sessionID + '/' + modelID,
        //excludeBasePath: true
    })

    return response.data
}

export const getModelTypes = () => AJAX({
    url: BASE_URL + '/models/types',
    //excludeBasePath: true
})

export const getModels = async () => {
    const response = await AJAX({
        url: BASE_URL + '/models',
        //excludeBasePath: true
    })

    return response.data
}

export const issueTrainingJob = (pkg) => AJAX({
    url: BASE_URL + '/queueTrainingSession',
    //excludeBasePath: true,
    method: 'POST',
    data: pkg,
})

export const issueAutoTrainingJob = (pkg, auto="") => AJAX({
    url: BASE_URL + '/queueTrainingSession' + auto,
    //excludeBasePath: true,
    method: 'POST',
    data: pkg
})


export const startPOFModelTraining = (pkg) => AJAX({
    url: BASE_URL + '/startPOFModelTraining',
    //excludeBasePath: true,
    method: 'POST',
    data: pkg
})

export const issueBasicTrainingJob = (pkg, task) => AJAX({
    url: BASE_URL2 + '/basicTraining/' + task,
    //excludeBasePath: true,
    method: 'POST',
    data: pkg,
})


export const getCellData = async (sessionID, modelID) => {
    console.log("getcelldata")
    const response = await AJAX({
        url: MONGO_URL + '/getCellData/' + sessionID + '/' + modelID,
        //excludeBasePath: true,
        method: 'GET'
    })

    return response.data
}

export const updateModelData = async (pkg) => {
    const response = await AJAX({
        url: MONGO_URL + '/updateModelData',
        //excludeBasePath: true,
        method: 'POST',
        data: pkg
    })

    return response.data
}

export const updateRetrainMethod = async(pkg) => AJAX({
    url: MONGO_URL + '/updateRetrainMethod',
    method: 'POST',
    data: pkg
})


export const deleteModel = async (modelID) => AJAX({
    url: BASE_URL + '/models/delete/' + modelID,
    //excludeBasePath: true,
    method: 'DELETE',
    //isWithCredentials: true,
})


export const getSessions = async () => {
    console.log("getsessions")
    const response = await AJAX({
        url: MONGO_URL + '/getSessions',
        //excludeBasePath: true,
        method: 'GET',
        //isWithCredentials: true
    })

    console.log(response)
    return response.data
}

export const postSession = async (sessionObj) => AJAX({
    url: MONGO_URL + '/postSession',
    //excludeBasePath: true,
    method: 'POST',
    data: sessionObj,
    //isWithCredentials: true
})


export const getAcceptedModels = async (sessionID) => {
    const response = await AJAX({
        url: MONGO_URL + '/getAcceptedModels/' + sessionID,
        //excludeBasePath: true,
        method: 'GET',
    })

    return response.data
}


export const acceptModel = async (modelObj) => AJAX({
    url: MONGO_URL + '/acceptModel',
    //excludeBasePath: true,
    method: 'POST',
    data: modelObj,
    //isWithCredentials: true,
})


export const getCellCount = async (sessionID) => {
    console.log(MONGO_URL + '/getModelData/' + sessionID)
    const response = await AJAX({
        url: MONGO_URL + '/getModelData/' + sessionID,
        //excludeBasePath: true,
        method: 'GET'
    })


    console.log(response)
    console.log(response.data)
    return response.data
}

export const getBasicModels = async () => {
    const response = await AJAX({
        url: BACKEND.API_URL + 'metadata/getBasicModels',
        //excludeBasePath: true,
        method: 'GET'
    })

    return response.data
}

export const basicRun = async (modelID) => {
    const response = await AJAX({
        url: BASE_URL2 + '/basicRun/' + modelID,
        //excludeBasePath: true,
        method: 'POST'
    })
}

export const getBasicCell = async (modelID) => AJAX({
    url: MONGO_URL + '/getBasicCell/' + modelID,
    //excludeBasePath: true,
    method: 'GET'
})

export const trainModel = (modelId) => AJAX({
    url: BASE_URL + '/jobs/train/' + modelId,
    //excludeBasePath: true,
    method: 'POST'
})

export const postModel = async (model) => {
    const response = await AJAX({
        url: BASE_URL + '/models',
        //excludeBasePath: true,
        method: 'POST',
        data: model
    })

    return response.data
}

export const cancelDetection = (modelId) => AJAX({
    url: BASE_URL + '/jobs/detect/cancel/' + modelId,
    //excludeBasePath: true,
    method: 'POST'
})

export const getParams = () => AJAX({
    url: BASE_URL + '/params',
    //excludeBasePath: true
})

export const getMetrics = () => AJAX({
    url: BASE_URL + '/metrics',
    //excludeBasePath: true
})

export const getTrainingProgress = (modelId) => AJAX({
    url: BASE_URL + '/train_progress/' + modelId,
    //excludeBasePath: true
})

export const getPartitionSpecs = async() => {
    let url = HPC_URL + '/getPartitionSpecs'

    const response = await AJAX({
        url: url,
        //excludeBasePath: true
    })

    return response.data
}
