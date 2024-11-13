const mongodb = require('mongodb')
const crypto = require('crypto')

let client
let db
let users
let sessions
let alerts

async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient('mongodb+srv://charlestiu:DirtInYourEye_28@cluster0.n2c2j.mongodb.net/')
        await client.connect()
        db = client.db('Capstone')
        alerts = db.collection('Alerts')
        sessions = db.collection('Sessions')
        users = db.collection('Users')
    }
}

async function addAlert(current_alert){
    await connectDatabase()
    await alerts.insertOne(current_alert);
}

async function validateCredentials(username, password) {
    await connectDatabase()
    let user = await users.find({name:username}).toArray()
    user = user[0]

    let hash = crypto.createHash('sha512')
    hash.update(password)
    let p = hash.digest('hex')
    if (user && user.name === username && user.password === p) {
        return user
    }

    return false
}

async function getAccounts(){
    await connectDatabase()
    return await users.find().toArray()
}

async function getUserFromID(id){
    await connectDatabase()
    let AccountDetails = await users.find({ID:id}).toArray()
    return AccountDetails[0]
}

async function getAccountDetails(name) {
    await connectDatabase()
    let AccountDetails = await users.find({name:name}).toArray()
    return AccountDetails[0]
}

async function updateAssignedStation(ID, stationName){
    await connectDatabase()
    await users.updateOne({ID:ID}, {$set: {assigned_station: stationName}})
}

async function assignManager(ID, current_stationNumber){
    await connectDatabase()
    await stations.updateOne({stationNumber:current_stationNumber}, {$set: {managerID: ID}})
}

async function createStation(stationNumber, stationName, location, PremiumfuelThres, SuperfuelThres, fuelCap){
    await connectDatabase()
    let data = {
        stationNumber:stationNumber, 
        stationName:stationName, 
        fuelGrades:{
            Premium: {price:2, fuelThreshold:PremiumfuelThres, tankCapacity:10000},
            Super:{ price:3.5, fuelThreshold:SuperfuelThres, tankCapacity:8000}
        },
        tankCapacity:fuelCap,
        location:location
    }
    await stations.insertOne(data)
}

async function getStations() {
    await connectDatabase()
    return await stations.find().toArray()
}

async function getStationFromID(ID) {
    await connectDatabase()
    let station = await stations.findOne({managerID:ID})
    return station   
}
async function unassignManagerStation(ID){
    await connectDatabase()
    await users.updateOne({ID:ID}, {$set: {assigned_station:""}})
    await stations.updateOne({managerID:ID}, {$unset: {managerID:""}})
}

async function getStationFromNumber(Number) {
    await connectDatabase()
    let station = await stations.findOne({stationNumber:Number})
    return station
}

async function getPetrolRecords() {
    await connectDatabase()
    return await records.find().toArray()
}
async function getPetrolRecordsfromNumber(num) {
    await connectDatabase()
    return await records.findOne({stationNumber:num})
}

async function getLatestRecord(station_number){
    await connectDatabase()
    return await records.find({stationNumber: station_number}).toArray()
}

async function getRecordFromDate(date_data, current_stationNumber){
    await connectDatabase()
    return await records.find({stationNumber:current_stationNumber, Date:date_data}).toArray()
}

async function newRecord(current_stationNumber, date_data){
    await connectDatabase()
    let new_record = {stationNumber:current_stationNumber, Date:date_data}
    await records.insertOne(new_record)
}

async function updateSales(sales_data, current_stationNumber, date_data){
    await connectDatabase()
    await records.updateOne({stationNumber:current_stationNumber, Date:date_data}, {$set: {Sales: sales_data}})
}

async function updateFuel(fuel_data, current_stationNumber, date_data){
    await connectDatabase()
    await records.updateOne({stationNumber:current_stationNumber, Date:date_data}, {$set: {fuelLevels: fuel_data}})
}

async function getDelivery(station, stationID) {
    await connectDatabase()
    // return await stations.updateOne({stationNumber:stationID}, {$set: {
    //     fuelGrades: { Premium: { fuelAmount: PremiumFuel}} , fuelGrades: { Super: { fuelAmount: SuperFuel}}
    // }})
    return await stations.replaceOne({ stationNumber: stationID } , station)
}
async function addStation(station) {
    await connectDatabase()
    await stations.insertOne(station)
}

async function updateStation(station){
    await connectDatabase()
    await stations.replaceOne({stationNumber:station.stationNumber}, station)
}

async function getSession(key) {
    await connectDatabase()
    let result = await sessions.find({key:key}).toArray()
    return result[0]
}

async function saveSession(sd) {
    await connectDatabase()
    let sessiondata = {key:sd.key, expiry:sd.expiry, data:sd.data}
    await sessions.insertOne(sessiondata)
}

async function updateSession(session){
    await connectDatabase()
    await sessions.replaceOne({ key: { $regex: session.key } }, session)
}

async function deleteSession(key) {
    await connectDatabase()
    await sessions.deleteOne({key:key})
}

async function deleteStation(station_number){
    await connectDatabase()
    await stations.deleteOne({stationNumber: station_number})
}

async function deleteRecords(station_number){
    await connectDatabase()
    await records.deleteMany({stationNumber: station_number})
}
async function removeUser(accountID){
    await connectDatabase()
    await users.deleteOne({ID: accountID})
}

async function updateUser(user) {
    await connectDatabase()
    await users.replaceOne({ID:user.ID}, user)
}

async function addAccount(account) {
    await connectDatabase()
    let hash = crypto.createHash('sha512')
    hash.update(account.password)
    let p = hash.digest('hex')

    account.password = p
    await users.insertOne(account)
}

async function getAccountHighestID(){
    await connectDatabase()
    return await users.find().sort({ID:-1}).limit(1).toArray() // for MAX
}

async function getHighestStationNumber(){
    await connectDatabase()
    return await stations.find().sort({stationNumber:-1}).limit(1).toArray() // for MAX
}

async function updateProfilePic(fname, id){
    await connectDatabase()
    await users.updateOne({ID:id}, {$set: {image:fname}})
}

module.exports = {
    validateCredentials,
    getAccounts,
    updateProfilePic,
    getStations,
    assignManager,
    getSession,
    addAccount,
    saveSession,
    getLatestRecord,
    deleteSession,
    deleteRecords,
    getAccountDetails,
    updateSession,
    updateUser,
    updateStation,
    getStationFromID,
    getPetrolRecords,
    getRecordFromDate,
    updateSales,
    updateFuel,
    getDelivery,
    newRecord,
    createStation,
    getPetrolRecordsfromNumber,
    getUserFromID,
    updateAssignedStation,
    getStationFromNumber,
    addStation,
    unassignManagerStation,
    getAccountHighestID,
    getHighestStationNumber,
    deleteStation,
    removeUser,
    addAlert
}