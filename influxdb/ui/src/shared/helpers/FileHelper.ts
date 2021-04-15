export const csvToJSON = async (csv) => {
    var lines = csv.split("\n");
    var result = [];
    var headers = lines[0].split(",");

    for (var i = 1; i < lines.length; i++) {
        var obj = {};
        var currentline = lines[i].split(",");

        for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
        }

        result.push(obj);
    }

    return result;
}

export const xlsxToJSON = async (xlsx) => {
    console.log(xlsx);
    var lines = xlsx.split("\n");
    var result = [];
    var headers = lines[0].split(",");

    for (var i = 1; i < lines.length; i++) {
        var obj = {};
        var currentline = lines[i].split("\t");

        for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
        }

        result.push(obj);
    }

    return result;
}

export const fileAnalyzer = (headers, required, content, fileName) => {
    let errors = [];
    let isFatalError = false;

    // check if there is a record in the file
    if (content.length === 0) {
        let error = {
            "type": "ERROR",
            "color": "red",
            "text": "ERROR: This file does not contain a record",
        }
        errors = [...errors, error];
        isFatalError = true;
        return { isFatalError, errors };
    }

    // check for desired fields in the file header
    let notFoundHeaders = "";
    required.forEach(requiredProp => {
        if (!Object.keys(content[0]).includes(requiredProp)) {
            notFoundHeaders += requiredProp + ", ";
        }
    })

    if (notFoundHeaders !== "") {
        let error = {
            "type": "ERROR",
            "color": "red",
            "text": `ERROR: This file does not contain these headers: (${notFoundHeaders.substring(0, notFoundHeaders.length - 2)})`
        }
        errors = [...errors, error];
        isFatalError = true;
        return { isFatalError, errors };
    }

    content.pop();
    // find if required fields are blank
    content.forEach((row, index) => {
        let count = 0;
        let keys = "";

        Object.keys(row).forEach(rowProp => {
            if (required.includes(rowProp) && row[rowProp] === "") {
                count += 1;
                keys += rowProp + ", ";
            }
        });

        if (count != 0) {
            let msg = count == 1
                ? `In line: ${index + 1} ERROR: ${count} field cannot be empty. (${keys.substring(0, keys.length - 2)})`
                : `In line: ${index + 1} ERROR: ${count} fields cannot be empty. (${keys.substring(0, keys.length - 2)})`;

            let error = {
                "type": "ERROR",
                "color": "red",
                "text": msg
            };
            errors = [...errors, error];
        }
    })


    content.forEach((row, index) => {
        // find undefined, empty fields and their number in each record
        let count = 0;
        let emptyCount = 0;
        let keys = "";
        let emptyKeys = "";

        Object.keys(row).forEach((item) => {
            if (!required.includes(item)) {
                if (row[item] === undefined) {
                    count += 1;
                    keys += item + ", ";
                }

                if (row[item] === "") {
                    emptyCount += 1;
                    emptyKeys += item + ", ";
                }
            }
        });

        if (count != 0) {
            let msg = count == 1
                ? `In line: ${index + 1} WARNING: ${count} field is missing in this line. (${keys.substring(0, keys.length - 2)})`
                : `In line: ${index + 1} WARNING: ${count} fields are missing in this line. (${keys.substring(0, keys.length - 2)})`;

            let error = {
                "type": "WARNING",
                "color": "yellow",
                "text": msg
            };
            errors = [...errors, error];
        }

        if (emptyCount != 0) {
            let msg = emptyCount == 1
                ? `In line: ${index + 1} WARNING: ${emptyCount} field is empty in this line. (${emptyKeys.substring(0, emptyKeys.length - 2)})`
                : `In line: ${index + 1} WARNING: ${emptyCount} fields are empty in this line. (${emptyKeys.substring(0, emptyKeys.length - 2)})`;

            let error = {
                "type": "WARNING",
                "color": "yellow",
                "text": msg
            }
            errors = [...errors, error];
        }
    });

    console.log("helper", errors);
    if (errors.length === 0) {
        let info = {
            "type": "INFO",
            "color": "blue",
            "text": `INFO: All lines were scanned and an error was not found.`,
        }
        errors.push(info);
    }

    return { isFatalError, errors };
}