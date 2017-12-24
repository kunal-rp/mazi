var express = require('express');
const bcrypt = require('bcrypt');//Encrypting passwords and generating hashes for email verification
var path = require('path');
var jwt = require('jsonwebtoken')
var WebSocketServer = require("ws").Server
var cors = require('cors');

var serverFunctions = require('./serverFunctions.js');
var db = require('./DBPoolConnection.js')
var connectionPool = db.getPool();
var gen = require('./generalFunction.js')

//Ensures server continues to run if any exception occurs. Will have to come up with a better system in the future
process.on('uncaughtException', function (err) {
  console.log(err);
});
var port = 3000
app = express();



var server = app.listen(port,'0.0.0.0');

app.use(express.static('public'));

var codes;
gen.generateCodes(function(data){
  codes = data;
  gen.setCodes(codes)
  console.log("Local Codes:")
  console.log(codes)
});



app.get('/',function(req,res, next){
  res.sendFile(path.join(__dirname, '/public', 'index.html'));
})

//testing the mysql concurrent data
app.get('/data',function(req,res){
  serverFunctions.getCollegeParkingData(function(code, collegeData,parkinglotData){
    res.json({code:code, cd:collegeData,pd:parkinglotData});
  })
});

app.get('/getPropData',function(req,res){
  gen.checkReqGeneral(req,res,function(){
    getPropData(function(ids, data){
      res.json({ids:ids , data : data});
    })
  })
});

app.get('/codes',function(req,res){
  gen.checkReqBasic(req, res, function(){
    res.json(codes)
  })
});

app.get('/login',function(req,res){
  //checks if data is encrypted with general codes and user specific token
  gen.checkReqGeneral(req, res, function(data){
    //attempts login with the passed username and password values
    gen.attemptLogin(res,data, function(user_id){
      //perform login match Operations
      gen.loginUser(res,user_id, function(){
        //updates the user with new auth token
        gen.updateUserAuth(res,user_id, function(token){
          //return valid response
          gen.validResponse(res,"Sucsessful Login", {auth_token:token})
        })
      })
    })
  })
});

app.get('/checkusername',function(req,res){
  //checks if data is encrypted with general codes and user specific token
  gen.checkReqGeneral(req, res, function(data){
    gen.attemptCheckUsername(res, data, function(user_name){
      gen.checkUsername(res, user_name, function(){
        gen.validResponse(res, "Username is avalible")
      })
    })
  })
})

app.get('/reset',function(req,res){
  gen.checkReqGeneral(req,res,function(data){
    console.log('attempt reset')
    gen.attemptReset(res, data, function(){
      console.log(' reset user')
      gen.resetUser(res, data, function(){
        console.log('valid response')
        gen.validResponse(res, "Reset Confirmed")
      })
    })
  })
})



app.get('/update',function(req, res){
  gen.checkReqSpecific(req, res, function(data){
    var user_id = data.user_id
    gen.updateUserAuth(user_id,function(error,token){
      if(error){
        gen.strucuralError(res, "An Error Occured. We apologize!")
      }
      else{
        console.log(user_id + " Update Auth Token : "+token )
        gen.validResponse(res,"Auth Code Updated" )
      }
    })
  })
});

app.get('/addSuggestion',function(req,res){
  gen.checkReqSpecific(req,res,function(data){
    data['user_id'] = data.user_id
    serverFunctions.addSuggestion(data,function(err){
      if(err){
        gen.strucuralError(res, "Sorry! An Error Occured")
      }
      else{
        gen.validResponse(res,"Your suggestion has been recorded")
      }
    })
  })
})

function getPropData(callback){
  var final = {}
  var ids = []
  var query_get_prop_data = "SELECT * FROM `"+tables['table_connect']+"` ORDER BY RAND() LIMIT 10"
  connectionPool.query(query_get_prop_data, function(error,results){
    if(error){
      console.log("ERROR | getPropData | sql query \n "+error+" \n"+query_get_prop_data)
      callback(null, null)
    }
    else{
      for(i=0;i < results.length; i++){
        ids.push(results[i]['index_room_name'])
        final[results[i]['index_room_name']] = {
          parkinglot_id : results[i]['parkinglot_id'],
          parker_lat:results[i]['parker_lat'],
          parker_lng:results[i]['parker_lng'],
          pu_lat:results[i]['pu_lat'],
          pu_lng:results[i]['pu_lng'],
          time_saved:10 + Math.round(Math.random()+1)
        }
      }
      callback(ids, final)
    }
  })
}



/*
var wss = new WebSocketServer({server: server})
console.log("websocket server created")

wss.on("connection", function(ws) {
var id = setInterval(function() {
ws.send(JSON.stringify(new Date()), function() {  })
}, 1000)

console.log("websocket connection open")

ws.on("close", function() {
console.log("websocket connection close")
clearInterval(id)
})
})
*/
