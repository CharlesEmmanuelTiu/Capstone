//Import method is newer than the require sht
const persistence = require('./persistence.js')
const crypto = require('crypto')

async function validateCredentials(username, password) {
    return await persistence.validateCredentials(username, password)
}

async function getUsers() {
    return await persistence.getAccounts()
}

async function getUserFromID(ID){
    return await persistence.getUserFromID(ID)
}
async function getUser(username) {
    return await persistence.getAccountDetails(username)
}
async function removeUser(accountID){
    return await persistence.removeUser(accountID)
}

async function getStations() {
    return await persistence.getStations()
}
async function addStation(station){
    return await persistence.addStation(station)
}

async function generateStationNumber(){
    let station = await persistence.getHighestStationNumber()
    return station[0].stationNumber+1
}

async function getStationFromID(ID) {
    return await persistence.getStationFromID(ID)
}

async function getPetrolRecords() {
    return await persistence.getPetrolRecords()
}

async function getPetrolRecordsfromNumber(num) {
    return await persistence.getPetrolRecordsfromNumber(num)
}

async function getLatestRecord(station_number){
    return await persistence.getLatestRecord(station_number)
}

//Finds record by the filter of date and station Number.
async function getRecordFromDate(date_data, current_stationNumber){
    return await persistence.getRecordFromDate(date_data, current_stationNumber)
}

//Creates a new record if the current one doesn't exist.
async function newRecord(current_stationNumber, date_data){
    await persistence.newRecord(current_stationNumber, date_data)
}

//Overwrites the sales data 
async function updateSales(sales_data, current_stationNumber, date_data){
    await persistence.updateSales(sales_data, current_stationNumber, date_data)
}

//Overwrites the fuel level data
async function updateFuel(fuel_data, current_stationNumber, date_data){
    await persistence.updateFuel(fuel_data, current_stationNumber, date_data)
}

//Update the fuelAmount in petrol_stations 
async function getDelivery(PremiumFuel, SuperFuel, manID) {
    let station = await persistence.getStationFromID(manID)
    let PremCap = station.fuelGrades.Premium.tankCapacity
    let SuperCap = station.fuelGrades.Super.tankCapacity
    let Sub_PremFuel = station.fuelGrades.Premium.fuelAmount
    let Sub_SupFuel = station.fuelGrades.Super.fuelAmount
    if (Sub_PremFuel+PremiumFuel > PremCap || Sub_PremFuel+PremiumFuel < 0 || Sub_SupFuel+SuperFuel > SuperCap || Sub_SupFuel+SuperFuel < 0) {
        return false
    }
    station.fuelGrades.Premium.fuelAmount += PremiumFuel
    station.fuelGrades.Super.fuelAmount += SuperFuel
    return await persistence.getDelivery(station, Number(station.stationNumber))
}

async function saveSession(data) {
    let key = crypto.randomUUID()
    let sd = {
        key:key,
        expiry:new Date(Date.now() + 1000*60*30),
        data:data
    }
    await persistence.saveSession(sd)
    return key
}

async function getSession(key) {
    return await persistence.getSession(key)
}

async function deleteSession(key) {
    return await persistence.deleteSession(key)
}

async function generateToken(sessionID){
    let token = Math.floor(Math.random()*1000000)
    let sessionData = await persistence.getSession(sessionID)
    sessionData.csrfToken = token
    await persistence.updateSession(sessionData)
    return token
}

async function cancelToken(sessionID){
    let sessionData = await persistence.getSession(sessionID)
    delete sessionData.csrfToken
    await persistence.updateSession(sessionData)
}

async function updateStation(station){
    await persistence.updateStation(station)
}
async function updatePassword(new_name, new_password){
    await persistence.updatePassword(new_name, new_password)
}

async function updateProfilePic(fname, id){
    await persistence.updateProfilePic(fname, id)
}

async function updateUser(user, session, newData) {
    session.data.user = newData.name
    await persistence.updateSession(session)

    let result = undefined
    if (user.password === newData.password) {
        result = false // user password is unchanged
    }
    result = true // user password is changed

    user.name = newData.name
    user.password = newData.password
    user['phone_number'] = newData['phone_number']
    await persistence.updateUser(user)

    return result
}

async function updateAssignedStation(ID, stationName){
    await persistence.updateAssignedStation(ID, stationName)
}

async function generateID(){
    let account = await persistence.getAccountHighestID()
    return account[0].ID+1
}

async function addAccount(account){
    await persistence.addAccount(account)
}

async function deleteStation(station_number){
    await persistence.deleteStation(station_number)
}

async function deleteRecords(station_number){
    await persistence.deleteRecords(station_number)
}

async function assignManager(ID, stationNumber){
    await persistence.assignManager(ID, stationNumber)
}

async function getStationFromNumber(Number){
    return await persistence.getStationFromNumber(Number)
}

async function unassignManagerStation(ID){
    await persistence.unassignManagerStation(ID)
    return true
}

async function createStation(stationNumber, stationName, location, PremiumfuelThres, PremiumfuelCap, SuperfuelThres, SuperfuelCap){
    await persistence.createStation(stationNumber, stationName, location, PremiumfuelThres, PremiumfuelCap, SuperfuelThres, SuperfuelCap)
}

module.exports = {
    validateCredentials,
    getUser,
    updateProfilePic,
    saveSession,
    getSession,
    getStations,
    addAccount,
    deleteSession,
    deleteRecords,
    getUsers,
    getPetrolRecords,
    getStationFromID,
    getRecordFromDate,
    getLatestRecord,
    updateSales,
    updateFuel,
    generateID,
    getDelivery,
    updateStation,
    newRecord, 
    updateUser,
    generateToken,
    cancelToken,
    createStation, 
    getPetrolRecordsfromNumber,
    assignManager,
    generateStationNumber,
    getUserFromID,
    updateAssignedStation,
    getStationFromNumber,
    addStation,
    unassignManagerStation,
    deleteStation,
    removeUser
}