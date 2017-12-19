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


var tables = {
  table_server:"server",
  table_gen:"user_gen",
  table_college_info:"college_info",
  table_parkinglot_info:"parkinglot_info",
  table_connect:"_connect"
}

var codes;
serverFunctions.setVariables(tables,function(){

  gen.generateCodes(function(data){
    codes = data;
    gen.setCodes(codes)
    console.log("Local Codes:")
    console.log(codes)
  });
})



app.get('/',function(req,res, next){

  res.sendFile(path.join(__dirname, '/public', 'index.html'));
})

/*
//testing the 'ws' library
//still have to test the concurrent websocket connection limits
app.get('/ws',function(req,res){
res.sendFile(path.join(__dirname, '/public', 'ws.html'));
});
*/


//testing the mysql concurrent data
app.get('/data',function(req,res){
  serverFunctions.getCollegeParkingData(function(code, collegeData,parkinglotData){
    res.send(JSON.stringify({code:code, cd : collegeData,pd:parkinglotData},null,'\n'));
  })
});

//testing the mysql concurrent data
app.get('/getPropData',function(req,res){
  gen.checkReqGeneral(req,res,function(){
    getPropData(function(ids, data){
      res.send(JSON.stringify({ids:ids , data : data},null,'\n'));
    })
  })
});

app.get('/codes',function(req,res){
  res.json(codes)
});

app.get('/update',function(req, res){
  var user_id = '9D8FD0'
  updateUserAuth(user_id,function(error,token){
    if(error){
      res.send("Error Occured")
    }
    else{
      console.log(user_id + " Update Auth Token : "+token )
      res.send("Update Auth Token" )
    }
  })
});




function updateUserAuth(user_id, callback){
  //updates the 'auth_token' value of the user with a newly generated tokens
  //call
  gen.generateCustomKey(function(token){
    serverFunctions.updateUserAuth(user_id,token,callback)
  });
}


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
