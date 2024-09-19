const persistence = require('./persistence.js')

async function setFlash(session, message, type = "danger"){
    let sd = await persistence.getSession(session)
    if (!sd) {
        return undefined
    }
    sd.flash = message
    sd.flashType = type

    await persistence.updateSession(sd)
}

async function getFlash(key){
    let sd = await persistence.getSession(key)
    if (!sd){
        return undefined
    }
    let result = sd.flash
    delete sd.flash
    delete sd.flashType
    await persistence.updateSession(sd)
    return result
}

module.exports = {
    setFlash,
    getFlash
}