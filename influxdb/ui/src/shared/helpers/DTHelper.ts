export const getDTInfoByID = (dt, nodeID) => {
    let matchedPart = {};

    for (const factory of dt) {
        if (factory["id"] === nodeID) { matchedPart = factory; break; }
        for (const pl of factory["productionLines"]) {
            if (pl["@id"] === nodeID) { matchedPart = pl; break; }
            for (const machine of pl["machines"]) {
                if (machine["@id"] === nodeID) { matchedPart = machine; break; }
                for (const component of machine["contents"]) {
                    if (component["@id"] === nodeID) { matchedPart = component; break; }
                }
            }
        }
    }

    return matchedPart;
}