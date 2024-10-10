//Import method is newer than the require sht
//For routes, add a folder and have one route each js file
const business = require('./business.js')
const flash = require('./flash.js')

const express = require('express')
const handlebars = require('express-handlebars')
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const crypto = require('crypto')

let app = express()
app.set('views', __dirname+"/templates")
app.use(express.static('static'))
app.use('/static', express.static(__dirname+"/static"))
app.set('view engine', 'handlebars')
app.engine('handlebars', handlebars.engine())
app.use(bodyParser.urlencoded({extended:true}))
app.use(cookieParser())
app.use('/images', express.static(__dirname+"/static/images"))

// function checkLevel(level, threshold) { 
//     if (level <= threshold) {
//         return true
//     }
//     return false
// }

async function authenticateUser(key) {
    if (!key) {
        return false
    }

    let sd = await business.getSession(key)
    if (!sd) {
        return false
    }

    return sd
}

app.get('/', async (req, res) => {
    let key = req.cookies.session
    let valid = await authenticateUser(key)
    let flashSession = req.cookies.flash
    let flashValid = await authenticateUser(flashSession)
    let fm = undefined
    let flashType = undefined
    let isAdmin = false

    if (!valid) {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, 'Login required')
        res.redirect('/login')
        return
    }
    else{
        let user = await business.getUser(valid.data.user)
        if (user.account_type == 'admin'){
            isAdmin = true

        }

        res.render('dashboard', {
            user:user,
            admin:isAdmin
            })
    }
})

let sensors = [
    { id: 1, name: 'Temperature Sensor', status: 'Active' },
    { id: 2, name: 'Humidity Sensor', status: 'Active' },
    { id: 3, name: 'Pressure Sensor', status: 'Active' },
  ];

app.get('/infrastructure', async (req, res) => {
    let key = req.cookies.session
    let valid = await authenticateUser(key)

    let flashSession = req.cookies.flash
    let flashValid = await authenticateUser(flashSession)
    let fm = undefined
    let flashType = undefined
    let isAdmin = false

    if (!valid) {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, 'Login required')
        res.redirect('/login')
        return
    }
    else{
        let user = await business.getUser(valid.data.user)
        if (user.account_type == 'admin'){
            isAdmin = true

        }

        res.render('sensors', {
            user:user,
            admin:isAdmin,
            sensors:sensors
            })
    }
})


app.get('/login', async (req, res) => {
    let key = req.cookies.session
    let valid = await authenticateUser(key)

    let flashSession = req.cookies.flash
    let flashValid = await authenticateUser(flashSession)

    let fm = undefined
    let flashType = undefined

    if (valid) {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, 'Already logged in', "info")
        res.redirect('/dashboard')
    }

    if (flashValid) {
        fm = await flash.getFlash(flashSession)
        flashType=flashValid.flashType
    }

    res.render("login", {
        layout:'../login',
        mssg:fm,
        flashType:flashType
    })
})

app.post('/login', async (req, res) => {
    let username = req.body.uname
    let password = req.body.psw
    let result = await business.validateCredentials(username, password)
    if (!result) {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, 'Invalid Credentials')
        res.redirect('/login')
        return
    }
    let key = await business.saveSession({user:username, type:result["account_type"], id:result.ID})
    res.cookie('session', key)
    res.redirect('/')
})

app.get('/logout', async (req, res) => {
    let key = req.cookies.session 
    let flashSession = req.cookies.flash
    if (key) {
        await business.deleteSession(key)
        res.clearCookie('session')
    }

    if (flashSession) {
        await business.deleteSession(flashSession)
        res.clearCookie('flash')
    }

    res.redirect('/')
})

// app.get('/dashboard', async (req, res) => {
//     // let key = req.cookies.session
//     // let valid = await authenticateUser(key)

//     // let flashSession = req.cookies.flash
//     // let flashValid = await authenticateUser(flashSession)
//     // let fm = undefined
//     // let flashType = undefined

//     // if (!valid) {
//     //     let flashKey = await business.saveSession({username:""})
//     //     res.cookie('flash', flashKey)
//     //     await flash.setFlash(flashKey, 'Login required')
//     //     res.redirect('/login')
//     //     return
//     // }

//     // let user = await business.getUser(valid.data.user)

//     // if (user["account_type"] !== "manager") {
//     //     let flashKey = await business.saveSession({username:""})
//     //     res.cookie('flash', flashKey)
//     //     await flash.setFlash(flashKey, 'Unauthorized access!')
//     //     res.redirect('/')
//     //     return
//     // }

//     // if (flashValid) {
//     //     fm = await flash.getFlash(flashSession)
//     //     flashType = flashValid.flashType
//     // }
    
//     // let stations = await business.getStationFromID(Number(valid.data.id))
//     // let record = undefined
//     // let newDate = undefined
//     // if (stations) {
//     //     // record = await business.getPetrolRecordsfromNumber(Number(stations.stationNumber))
//     //     raw_record = await business.getLatestRecord(Number(stations.stationNumber))
//     //     if(raw_record[0]){
//     //         sub_record = raw_record.sort((a,b) => Date.parse(b) - Date.parse(a))
//     //         record = sub_record[sub_record.length-1]
//     //         let newt = String(record.Date)
//     //         newDate = newt.slice(0, 25)
//     //     }
//     // }
//     res.render('dashboard', {
//         // user:user,
//         // manager: true,
//         // stations:stations,
//         // id:user.ID,
//         // record:record,
//         // date: newDate,
//         // mssg: fm,
//         // flashType:flashType
//     })
// })

// app.put('/sensors/:id/toggle', (req, res) => {
//     const sensorId = parseInt(req.params.id, 10);
//     const sensor = sensors.find((sensor) => sensor.id === sensorId);
  
//     if (sensor) {
//       sensor.status = !sensor.status;
//       res.json(sensor);
//     } else {
//       res.status(404).send({ message: 'Sensor not found' });
//     }
//   });
  

// app.get('/admin-dashboard', async (req, res) => {
//     let key = req.cookies.session
//     let valid = await authenticateUser(key)

//     let flashSession = req.cookies.flash
//     let flashValid = await authenticateUser(flashSession)
//     let fm = undefined
//     let flashType = undefined

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }
 
//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }

//     if (flashValid) {
//         fm = await flash.getFlash(flashSession)
//         flashType = flashValid.flashType
//     }
    
//     let stations = await business.getStations()
//     stations = stations.slice(0,5) // get first 5 stations
    
//     let users = await business.getUsers()
//     users = users.filter(user => (user['assigned_station'] != "" || user['assigned_station'] != undefined) && user['account_type'] === "manager").slice(0,5) // get first 5 assigned managers

//     res.render('admin', {
//         user:user,
//         admin:true,
//         id:user.ID,
//         stations:stations,
//         users:users,
//         mssg:fm,
//         flashType:flashType
//     })
// })


// app.get('/admin/view-statistics/:stationNumber', async(req, res)=>{
//     let key = req.cookies.session 
//     let valid = await authenticateUser(key)
//     let id = Number(req.params.stationNumber)

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }
//     let stations = await business.getStationFromNumber(id)
//     let record = undefined
//     let newDate = undefined
//     if (stations) {
//         // record = await business.getPetrolRecordsfromNumber(Number(stations.stationNumber))
//         raw_record = await business.getLatestRecord(Number(stations.stationNumber))
//         if(raw_record[0]){
//             sub_record = raw_record.sort((a,b) => Date.parse(b) - Date.parse(a))
//             record = sub_record[sub_record.length-1]
//             let newt = String(record.Date)
//             newDate = newt.slice(0, 25)
//         }
//     }
//     res.render('admin_viewStat', {
//         admin:true,
//         stations:stations,
//         records: record,
//         date: newDate,
//         stationNum: id
//     })
// })

// app.get('/admin/manage-accounts', async (req, res) => {
//     let key = req.cookies.session 
//     let valid = await authenticateUser(key)

//     let flashSession = req.cookies.flash
//     let flashValid = await authenticateUser(flashSession)
//     let fm = undefined
//     let flashType = undefined

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }

//     if (flashValid) {
//         fm = await flash.getFlash(flashSession)
//         flashType = flashValid.flashType
//     }

//     let CSRF = await business.generateToken(key)
//     let stations = await business.getStations()
//     let accounts = await business.getUsers()
//     res.render('admin_accounts', {
//         admin:true,
//         user:user,
//         mssg:fm,
//         csrfToken: CSRF,
//         flashType:flashType,
//         accounts:accounts,
//         stations:stations, helpers: { assigned, admin }
//     })
// })

// function admin(account){
//     if(account == 'admin'){
//         return true
//     }
//     else{
//         return false
//     }
// }

// function assigned(account){
//     if (account == ""){
//         return true
//     }
//     else{
//         return false
//     }
// }

// app.get('/admin/manage-accounts/:accountID', async (req, res) => {
//     let key = req.cookies.session 
//     let valid = await authenticateUser(key)

//     let flashSession = req.cookies.flash
//     let flashValid = await authenticateUser(flashSession)
//     let fm = undefined
//     let flashType = undefined

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }

//     if (flashValid) {
//         fm = await flash.getFlash(flashSession)
//         flashType = flashValid.flashType
//     }
//     let CSRF = await business.generateToken(key)
//     let ID = req.params.accountID
//     let stations = await business.getStations()
//     let account = await business.getUserFromID(Number(ID))
//     res.render('admin_assign', {
//         admin:true,
//         user:user,
//         csrfToken:CSRF,
//         account:account,
//         stations:stations, helpers: { incl }})
// })

// app.get("/admin/manage-accounts/remove/:accountID", async(req, res)=>{
//     let key = req.cookies.session 
//     let valid = await authenticateUser(key)

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }

//     let userID = Number(req.params.accountID)
//     let account1 = await business.getUserFromID(Number(userID))

//     let warning = 0
//     if (account1.assigned_station != ""){ // check if this accout is already assigned
//         warning = 1
//         let flashKey = await business.saveSession({username:""})
//         await business.unassignManagerStation(userID) // to unassign manager that was currently assigned to before assigning to another station
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, `Manager ${account1.name} removed from station!`, "success")
//         res.redirect("/admin/manage-accounts")
//     }
// })


// function incl(account, station){
//     if (station.managerID || account.assigned_station == station.stationName){
//         return true
//     }
//     else{
//         return false
//     }
// }

// app.post('/admin/manage-accounts/:accountID', async (req, res) => {
//     let key = req.cookies.session 
//     let valid = await authenticateUser(key)

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }

//     let CSRF = req.body.token
//     if (valid.csrfToken != CSRF){
//         res.status(419)
//         res.send("CSRF token is not matched")
//         return
//     }
//     let assigned_stationNumber = Number(req.body.assign_stat)
//     let ID = Number(req.params.accountID)
//     let account = await business.getUserFromID(ID)
//     if (!assigned_stationNumber){
//         res.redirect('/admin/manage-accounts')
//         return
//     }
//     let station = await business.getStationFromNumber(assigned_stationNumber)
//     let warning = 0
//     if (account.assigned_station && account.assigned_station != ""){ // check if this accout is already assigned
//         warning = 1
//         await business.unassignManagerStation(ID) // to unassign manager that was currently assigned to before assigning to another station
//     }
    
//     await business.updateAssignedStation(ID, station.stationName)
//     await business.assignManager(ID, station.stationNumber)

//     if(warning == 1){
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, `Manager ${account.name} reassigned!`, "success")
//         res.redirect('/admin/manage-accounts')
//         return
//     }
    
//     let flashKey = await business.saveSession({username:""})
//     res.cookie('flash', flashKey)
//     await flash.setFlash(flashKey, `Manager ${account.name} assigned`, "success")
//     res.redirect('/admin/manage-accounts')
// })

// app.post('/admin/remove-user/:accountID', async (req, res)=>{
//     let key = req.cookies.session
//     let valid = await authenticateUser(key)

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }
//     let CSRF = req.body.token
//     if (valid.csrfToken != CSRF){
//         res.status(419)
//         res.send("CSRF token is not matched")
//         return
//     }
//     let userId = Number(req.params.accountID)
    
//     let userName = req.body.name
//     await business.unassignManagerStation(userId)
//     let station = await business.getStationFromID(userId)
//     if (!station){                                //Checks if station does not contain managerID
//         await business.removeUser(userId)
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, `User #${userName} deleted!`, "success")
//         res.redirect('/admin/manage-accounts')
//         return
//     }   
    
//     if(station.managerID == userId){   //Checks if station with manager id matches with the given user id
//         await business.unassignManagerStation(station.managerID)
//     }
//     await business.removeUser(userId)
//     let flashKey = await business.saveSession({username:""})
//     res.cookie('flash', flashKey)
//     await flash.setFlash(flashKey, `User #${userName} deleted!`, "success")
//     res.redirect('/admin/manage-accounts')
// })

// app.get('/admin/manage-stations', async (req, res) => {
//     let key = req.cookies.session
//     let valid = await authenticateUser(key)

//     let flashSession = req.cookies.flash
//     let flashValid = await authenticateUser(flashSession)
//     let fm = undefined
//     let flashType = undefined

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }

//     if (flashValid) {
//         fm = await flash.getFlash(flashSession)
//         flashType = flashValid.flashType
//     }
    
//     let CSRF = await business.generateToken(key)
//     let stations = await business.getStations()
//     res.render('admin_stations', {
//         user:user,
//         admin:true,
//         user:user,
//         csrfToken:CSRF,
//         stations:stations,
//         mssg:fm,
//         flashType:flashType
//     })
// })


// app.get('/admin/add-station', async(req, res)=>{
//     let key = req.cookies.session
//     let valid = await authenticateUser(key) 

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }
//     let CSRF = await business.generateToken(key)
//     res.render('add_station', {
//         user:user,
//         admin:true,
//         csrfToken:CSRF,
//     })
// })

// app.post('/admin/add-station', async(req, res)=>{
//     let key = req.cookies.session
//     let valid = await authenticateUser(key)

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }
//     let CSRF = req.body.token
//     if (valid.csrfToken != CSRF){
//         res.status(419)
//         res.send("CSRF token is not matched")
//         return
//     }
//     let new_name = req.body.name
//     let new_location = req.body.location
//     let new_premium_price = Number(req.body.premium)
//     let new_premium_cap = Number(req.body.premiumCap)
//     let new_premium_threshold = Number(req.body.premiumThreshold)
//     let new_super_price = Number(req.body.super)
//     let new_super_cap = Number(req.body.superCap)
//     let new_super_threshold = Number(req.body.superThreshold)
//     let new_station_number = await business.generateStationNumber()
//     let new_station = {
//         "stationNumber": Number(new_station_number),
//         "stationName": new_name,
//         "fuelGrades": {
//             "Premium": {
//                 "price": new_premium_price,
//                 "fuelThreshold": new_premium_threshold,
//                 "tankCapacity": new_premium_cap
//             },
//             "Super": {
//                 "price": new_super_price,
//                 "fuelThreshold": new_super_threshold,
//                 "tankCapacity": new_super_cap
//             }
//         },
//         "location": new_location
//     }
//     await business.addStation(new_station)
//     let flashKey = await business.saveSession({username:""})
//     res.cookie('flash', flashKey)
//     await flash.setFlash(flashKey, 'New Station Added', "success")
//     res.redirect('/admin/manage-stations')
// })

// app.get('/admin/edit-station', async(req, res)=>{
//     let key = req.cookies.session
//     let valid = await authenticateUser(key)

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }
//     let station_number = req.query.station
//     let station = await business.getStationFromNumber(Number(station_number))
//     let CSRF = await business.generateToken(key)
//     res.render('edit_station', {
//         user:user,
//         admin:true,
//         csrfToken:CSRF,
//         station:station
//     })
// })

// app.post('/admin/delete-station', async (req, res) => {
//     let key = req.cookies.session
//     let valid = await authenticateUser(key)

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }
//     let CSRF = req.body.token
//     if (valid.csrfToken != CSRF){
//         res.status(419)
//         res.send("CSRF token is not matched")
//         return
//     }
//     let stationNumber = Number(req.body.stationNumber)
//     let station = await business.getStationFromNumber(stationNumber)
//     if(station.managerID){
//         await business.unassignManagerStation(station.managerID)
//     }
//     await business.deleteStation(stationNumber)
//     await business.deleteRecords(stationNumber)
//     let flashKey = await business.saveSession({username:""})
//     res.cookie('flash', flashKey)
//     await flash.setFlash(flashKey, `${station.stationName} deleted!`, "success")
//     res.redirect('/admin/manage-stations')
// })


// app.post('/admin/edit-station', async(req, res)=>{
//     let key = req.cookies.session
//     let valid = await authenticateUser(key)

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "admin") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }
//     let CSRF = req.body.token
//     if (valid.csrfToken != CSRF){
//         res.status(419)
//         res.send("CSRF token is not matched")
//         return
//     }
//     let new_name = req.body.name
//     let new_location = req.body.location
//     let new_premium_price = Number(req.body.premium)
//     let new_premium_cap = Number(req.body.premiumCap)
//     let new_premium_threshold = Number(req.body.premiumThreshold)
//     let new_super_price = Number(req.body.super)
//     let new_super_cap = Number(req.body.superCap)
//     let new_super_threshold = Number(req.body.superThreshold)
//     let station_number = req.body.stationNumber
//     let new_station = {
//         "stationNumber": Number(station_number),
//         "stationName": new_name,
//         "fuelGrades": {
//             "Premium": {
//                 "price": new_premium_price,
//                 "fuelThreshold": new_premium_threshold,
//                 "tankCapacity": new_premium_cap
//             },
//             "Super": {
//                 "price": new_super_price,
//                 "fuelThreshold": new_super_threshold,
//                 "tankCapacity": new_super_cap
//             }
//         },
//         "location": new_location
//     }
    
//     await business.updateStation(new_station)
//     let flashKey = await business.saveSession({username:""})
//     res.cookie('flash', flashKey)
//     await flash.setFlash(flashKey, `${new_name} updated!`, "success")
//     res.redirect('/admin/manage-stations')
// })

// app.get("/manager/sales", async (req, res)=>{
//     let key = req.cookies.session
//     let valid = await authenticateUser(key)
    
//     let flashSession = req.cookies.flash
//     let flashValid = await authenticateUser(flashSession)
//     let fm = undefined
//     let flashType = undefined

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "manager") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }
    
//     if (flashValid) {
//         fm = await flash.getFlash(flashSession)
//         flashType = flashValid.flashType
//     }

//     let CSRF = await business.generateToken(key)
//     let station = await business.getStationFromID(user.ID)
//     res.render('manage_sales', {
//         user:user,
//         manager:true,
//         csrfToken: CSRF,
//         station:station,
//         mssg:fm,
//         flashType:flashType
//     })
// })

// app.post('/manager/sales', async (req, res) =>{
//     let key = req.cookies.session 
//     let valid = await authenticateUser(key) 

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "manager") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }
//     let CSRF = req.body.token
//     if (valid.csrfToken != CSRF){
//         res.status(419)
//         res.send("CSRF token is not matched")
//         return
//     }
//     let sales_data = {
//         "Premium": Number(req.body.Sales_Premium),
//         "Super": Number(req.body.Sales_Super)
//       }

//     // setting the time of Date to midnight
//     let date_data = new Date(new Date(req.body.Selected_Date).setHours(3, 0, 0, 0, 0))
//     let current_station = await business.getStationFromID(user['ID'])
//     let current_record = await business.getRecordFromDate(date_data, current_station.stationNumber)
//     if (current_record.length == 0){
//         await business.newRecord(current_station.stationNumber, date_data)
//     }
//     let warning = 0
//     if(current_record.length != 0){
//         if(current_record[0].Sales){ // check if record already has sales data
//             warning = 1
//         }
//     }
//     await business.updateSales(sales_data, current_station.stationNumber, date_data)
//     await business.cancelToken(key)

//     if(warning == 1){
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Daily sales record is overwritten', "warning")
//         res.redirect('/manager/sales')
//         return
//     }

//     let flashKey = await business.saveSession({username:""})
//     res.cookie('flash', flashKey)
//     await flash.setFlash(flashKey, 'Daily fuel sales record added', "success")
//     res.redirect('/manager/sales')
// })

// app.get('/manager/fuel-levels', async (req, res) => {
//     let key = req.cookies.session 
//     let valid = await authenticateUser(key)

//     let flashSession = req.cookies.flash
//     let flashValid = await authenticateUser(flashSession)
//     let fm = undefined
//     let flashType = undefined

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "manager") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }
    
//     if (flashValid) {
//         fm = await flash.getFlash(flashSession)
//         flashType = flashValid.flashType
//     }

//     let CSRF = await business.generateToken(key)
//     let station = await business.getStationFromID(user.ID)
//     res.render('manage_fuel_levels', {
//         user:user,
//         manager:true,
//         csrfToken: CSRF,
//         mssg:fm,
//         flashType:flashType,
//         station:station
//     })
// })

// app.post('/manager/fuel-levels', async (req, res) => {
//     let key = req.cookies.session
//     let valid = await authenticateUser(key)

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "manager") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access')
//         res.redirect('/')
//         return
//     }
//     let CSRF = req.body.token
//     if (valid.csrfToken != CSRF){
//         res.status(419)
//         res.send("CSRF token is not matched")
//         return
//     }
//     let fuel_data = {
//         "Premium": Number(req.body.Fuel_Premium),
//         "Super": Number(req.body.Fuel_Super)
//       }
//     // setting the time of the date to midnight.
//     let date_data = new Date(new Date(req.body.Selected_Date).setHours(3, 0, 0, 0, 0))
//     let current_station = await business.getStationFromID(user['ID'])
//     let current_record = await business.getRecordFromDate(date_data, current_station.stationNumber)
//     if (current_record.length == 0){
//         await business.newRecord(current_station.stationNumber, date_data)
//     }
//     let warning = 0
//     if(current_record.length != 0){
//         if(current_record[0].fuelLevels){ // check if record already has sales data
//             warning = 1
//         }
//     }
//     let Today = new Date(new Date().setHours(3, 0, 0, 0, 0))
//     if(Today.toDateString() === date_data.toDateString()){
//         let result = await business.getDelivery(Number(req.body.Fuel_Premium), Number(req.body.Fuel_Super), user['ID'])
//         if (!result){
//             let flashKey = await business.saveSession({username:""})
//             res.cookie('flash', flashKey)
//             await flash.setFlash(flashKey, "Fuel levels must be within tank capacity", "danger")
//             res.redirect('/manager/fuel-levels')
//             return
//         }
//     }
//     await business.updateFuel(fuel_data, current_station.stationNumber, date_data)
//     await business.cancelToken(key)

//     if(warning == 1) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, "Daily fuel levels record is overwritten", "warning")
//         res.redirect('/manager/fuel-levels')
//         return
//     }
    
//     let flashKey = await business.saveSession({username:""})
//     res.cookie('flash', flashKey)
//     await flash.setFlash(flashKey, "Daily fuel levels record added", "success")
//     res.redirect('/manager/fuel-levels')
// })

// app.get('/manager/fuel-delivery', async (req, res) => {
//     let key = req.cookies.session 
//     let valid = await authenticateUser(key)

//     let flashSession = req.cookies.flash
//     let flashValid = await authenticateUser(flashSession)
//     let fm = undefined
//     let flashType = undefined

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }
    
//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "manager") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }
    
    
//     if (flashValid) {
//         fm = await flash.getFlash(flashSession)
//         flashType = flashValid.flashType
//     }

//     let station = await business.getStationFromID(user.ID)
//     let token = await business.generateToken(key)
//     res.render('manage_fuel_delivery', {
//         user:user,
//         station:station,
//         mssg:fm,
//         flashType:flashType,
//         manager:true,
//         csrfToken:token
//     })
// })

// app.post('/manager/fuel-delivery', async (req, res) => {
//     let key = req.cookies.session 
//     let valid = await authenticateUser(key)

//     if (!valid) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Login required')
//         res.redirect('/login')
//         return
//     }

//     let user = await business.getUser(valid.data.user)

//     if (user["account_type"] !== "manager") {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Unauthorized access!')
//         res.redirect('/')
//         return
//     }

//     let token = req.body.token
//     if (valid.csrfToken != token) {
//         res.status(419)
//         res.send("CSRF token mismatch")
//         return
//     }

//     let Premiumlevel = req.body.Premiumlevel
//     let Superlevel = req.body.Superlevel
//     let manID = req.body.station_id

//     if (!Premiumlevel || !Superlevel) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Cannot leave fuel amount fields empty!')
//         res.redirect('/manager/fuel-delivery')
//         return
//     }
    
//     let result = await business.getDelivery(Number(Premiumlevel), Number(Superlevel),Number(manID))
//     if (!result) {
//         let flashKey = await business.saveSession({username:""})
//         res.cookie('flash', flashKey)
//         await flash.setFlash(flashKey, 'Fuel level must be within tank capacity!')
//         res.redirect('/manager/fuel-delivery')
//         return
//     }

//     await business.cancelToken(key)
//     let flashKey = await business.saveSession({username:""})
//     res.cookie('flash', flashKey)
//     await flash.setFlash(flashKey, "Fuel shipment received", "success")
//     res.redirect('/manager/fuel-delivery')
// })


app.get("/profile", async(req, res) =>{
    let key = req.cookies.session 
    let valid = await authenticateUser(key)

    let pic = req.query.image
    let isAdmin = false

    let flashSession = req.cookies.flash
    let flashValid = await authenticateUser(flashSession)
    let fm = undefined
    let flashType = undefined


    if (!valid) {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, 'Login required')
        res.redirect('/login')
        return
    }
    
    
    if (flashValid) {
        fm = await flash.getFlash(flashSession)
        flashType = flashValid.flashType
    }

    let user = await business.getUser(valid.data.user)
    if (user['account_type'] === "admin") {
        isAdmin = true
    }

    res.render("user_page", {
        user:user,
        admin:isAdmin,
        image: pic,
        mssg:fm,
        flashType:flashType
    })
})

app.get('/add-account', async (req, res) => {
    let key = req.cookies.session
    let valid = await authenticateUser(key)

    let flashSession = req.cookies.flash
    let flashValid = await authenticateUser(flashSession)
    let fm = undefined
    let flashType = undefined

    let isAdmin = false

    if (!valid) {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, 'Login required')
        res.redirect('/login')
        return
    }


    if (flashValid) {
        fm = await flash.getFlash(flashSession)
        flashType = flashValid.flashType
    }
    // let key = req.cookies.session
    // let valid = await authenticateUser(key)
    // let user = await business.getUser(valid.data.user)
    // let isAdmin = false
    // if (user["account_type"] !== "admin") {
    //     let flashKey = await business.saveSession({username:""})
    //     res.cookie('flash', flashKey)
    //     await flash.setFlash(flashKey, 'Unauthorized access!')
    //     res.redirect('/')
    //     return
    // }
    // else{
    //     isAdmin = true
    // }
    let token = await business.generateToken(key)
    let user = await business.getUser(valid.data.user)
    if (user['account_type'] === "admin") {
        isAdmin = true
    }
    res.render('create_account', {
        user:user,
        admin:isAdmin,
        flashType:flashType,
        csrfToken:token
    })
})

app.post('/add-account', async(req, res)=>{
    let key = req.cookies.session
    let valid = await authenticateUser(key)

    if (!valid) {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, 'Login required')
        res.redirect('/login')
        return
    }

    let user = await business.getUser(valid.data.user)

    if (user["account_type"] !== "admin") {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, 'Unauthorized access!')
        res.redirect('/')
        return
    }
    let token = req.body.token
    if (valid.csrfToken != token) {
        res.status(419)
        res.send("CSRF token mismatch")
        return
    }
    let new_name = req.body.name
    let new_password = req.body.password
    let new_phone_number = String(req.body.phone_number)
    let new_email = String(req.body.email)
    let new_ID = await business.generateID()
    let new_account = {name: new_name, password: new_password, phone_number: new_phone_number, ID: Number(new_ID), email: new_email, account_type: "user", image: ""}
    
    await business.addAccount(new_account)
    
    let flashKey = await business.saveSession({username:""})
    res.cookie('flash', flashKey)
    await flash.setFlash(flashKey, 'New Account Added', "success")
    res.redirect('/')
})

app.get('/settings', async (req, res) => {
    let key = req.cookies.session
    let valid = await authenticateUser(key)

    let flashSession = req.cookies.flash
    let flashValid = await authenticateUser(flashSession)
    let fm = undefined
    let flashType = undefined

    let isAdmin = false

    if (!valid) {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, 'Login required')
        res.redirect('/login')
        return
    }
    
    let user = await business.getUser(valid.data.user)

    if (user['account_type'] === "admin") {
        isAdmin = true
    }

    if (flashValid) {
        fm = await flash.getFlash(flashSession)
        flashType = flashValid.flashType
    }

    let token = await business.generateToken(key)
    res.render('settings', {
        user:user,
        admin:isAdmin,
        mssg:fm,
        flashType:flashType,
        csrfToken:token
    })
})

app.post('/settings', async (req, res) => {
    let key = req.cookies.session
    let valid = await authenticateUser(key)

    if (!valid) {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, 'Login required')
        res.redirect('/login')
        return
    }
    
    let token = req.body.token
    if (valid.csrfToken != token) {
        res.status(419)
        res.send("CSRF token mismatch")
        return
    }

    let user = await business.getUser(valid.data.user)
    let username = req.body.uname
    let oldPass = req.body['o_psswd']
    let newPass = req.body['n_psswd']
    let conPass = req.body['c_psswd']
    let phone = req.body.phone
    let email = req.body.email

    let match = await business.validateCredentials(user.name, oldPass)
    if (!match) {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, "Current password does not match the database.", "danger")
        res.redirect("/settings")
        return
    }

    if (newPass !== conPass) {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, "Passwords do not match!", "danger")
        res.redirect("/settings")
        return    
    }

    let p = undefined
    if (newPass) {
        let hash = crypto.createHash('sha512')
        hash.update(newPass)
        p = hash.digest('hex')
    }

    let update = {
        name:username || user.name,
        password:p || user.password,
        phone_number:phone || user['phone_number'],
        email:email || user.email
    }
    
    let result = await business.updateUser(user, valid, update)
    if (result) {
        await business.cancelToken(key)
        await business.deleteSession(key)
        res.clearCookie('session')

        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, "Password changed. Login again", "info")
        res.redirect('/login')
        return
    }

    await business.cancelToken(key)
    let flashKey = await business.saveSession({username:""})
    res.cookie('flash', flashKey)
    await flash.setFlash(flashKey, "Profile Updated", "success")
    res.redirect('/profile')
})

app.use(fileUpload())
app.post('/uploadFile', async(req, res)=>{
    let key = req.cookies.session
    let valid = await authenticateUser(key)

    if (!valid) {
        let flashKey = await business.saveSession({username:""})
        res.cookie('flash', flashKey)
        await flash.setFlash(flashKey, 'Login required')
        res.redirect('/login')
        return
    }
    
    let token = req.body.token
    if (valid.csrfToken != token) {
        res.status(419)
        res.send("CSRF token mismatch")
        return
    }
    let userdetails = await business.getUser(valid.data.user)
    let theFile = req.files.submission
    let fname = String(theFile.name)
    await theFile.mv(`${__dirname}/uploads/`)
    await business.updateProfilePic(fname, userdetails.ID)
    let flashKey = await business.saveSession({username:""})
    res.cookie('flash', flashKey)
    await flash.setFlash(flashKey, 'Profile photo updated', "success")
    res.redirect('/profile')
})

app.use((req, res)=>{
    res.status(404)
    res.render('404_page')
})

app.use((req, res)=>{
    res.status(500)
    res.render('500_page')
})

app.listen("8000", () => {
    console.log("Application running on http://127.0.0.1:8000")
})
