var express = require('express');
var mysql= require('mysql');
const bcrypt = require('bcrypt');//Encrypting passwords and generating hashes for email verification
var path = require('path');
var jwt = require('jsonwebtoken')
var WebSocketServer = require("ws").Server

//Ensures server continues to run if any exception occurs. Will have to come up with a better system in the future
process.on('uncaughtException', function (err) {
  console.log(err);
});
var port = 3000
app = express();

var server = app.listen(port,'0.0.0.0');


//Connection to SQL DB
//NEED to create two seperate connections for user_prim and general uses for security
var connectionPool = mysql.createPool({
	connectionLimit:50,
	host: 'localhost',
	user: 'username',
	password: 'password',
	database: 'vierveTesting',
	port:3307
});

app.use(express.static('public'));

var table_server = "server"
var table_gen = "user_gen"

//generates the custom keys for jwt authentication
function generateCodes(callback){
    generateCustomKey(20,function(v_a){
        generateCustomKey(20,function(v_i){
            generateCustomKey(20,function(v_w){
            	var codes =
            		{android_key:v_a,
                    ios_key:v_i,
                    web_key:v_w};
            	updateServerinfo(codes,function(){callback(codes)})

            })
        })
    })
}

var codes;
generateCodes(function(data){
    codes = data;
});

//testing the 'ws' library
//still have to test the concurrent websocket connection limits
app.get('/ws',function(req,res){
  res.sendFile(path.join(__dirname, '/public', 'ws.html'));
});

//testing the mysql concurrent data
app.get('/test',function(req,res){
  res.sendFile(path.join(__dirname, '/public', 'testing.html'));
});
app.get('/codes',function(req,res){
   res.json(codes)
});

app.get('/update',function(req, res){
  updateUserAuth('9D8FD0',function(error,token){
    if(error){
      res.send("Error Occured")
    }
    else{
      console.log("#"+req.param("t")+" All Connections : "+connectionPool._allConnections.length)
      res.send("Update to "+token )
    }

  })
});



function updateServerinfo(codes,callback){
  //inserts the new server token values into the server table
  //should only happen when the server starts up
	var update_server_query = "INSERT INTO "+table_server + "(`start_time`, `android_key`, `ios_key`, `web_key`) VALUES ("+Math.round((new Date()).getTime() / 1000)+",'"+codes['android_key']+"','"+codes['ios_key']+"','"+codes['web_key']+"')"
	connectionPool.query(update_server_query,function(update_server_error){

    if(update_server_error){
			console.log("Error updating the server details")
    }
    else{
      console.log("Server Details SET")
      callback()
    }
  });
}

function updateUserAuth(user_id, callback){
//updates the 'auth_token' value of the user with a newly generated tokens
//call

  generateCustomKey(20,function(token){
    var update_user_auth_token = "Update `"+table_gen + "` set `auth_token` = '"+token+"' where `user_id`='"+user_id+"'"
    connectionPool.query(update_user_auth_token,function(update_uat_error){

      if(update_uat_error){
        console.log("Error updating the user auth token")
        console.log("User ID:"+user_id)
        console.log("Auth Token:"+token);
        console.log("Error : "+update_uat_error)
        callback(true)
      }
      else{
        callback(false, token)
      }
    });
  });

}

function generateCustomKey(size,callback){

    var max = Number.MAX_SAFE_INTEGER
    var min = 0

    setTimeout(function(){
      callback(Math.random() * (max - min) + min)
    }, 30);


    //callback(Math.random() * (max - min) + min)



}

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
