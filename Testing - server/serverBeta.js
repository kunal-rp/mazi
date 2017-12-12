var express = require('express');
var mysql= require('mysql');
const bcrypt = require('bcrypt');//Encrypting passwords and generating hashes for email verification
var path = require('path');
var jwt = require('jsonwebtoken')
var WebSocketServer = require("ws").Server
var cors = require('cors');

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
var table_college_info = "college_info"
var table_parkinglot_info = "parkinglot_info"
var table_connect = "_connect"

//generates the custom keys for jwt authentication
function generateCodes(callback){
    generateCustomKey(function(v_a){
        generateCustomKey(function(v_i){
            generateCustomKey(function(v_w){
            	var codes =
            		{android_key:v_a,
                    ios_key:v_i,
                    web_key:v_w};
            	//updateServerinfo(codes,function(){callback(codes)})
            })
        })
    })
}

var codes;
generateCodes(function(data){
    codes = data;
});


//app.use(cors({origin: 'http://localhost:3000'}));


app.get('/',function(req,res, next){

  res.sendFile(path.join(__dirname, '/public', 'index.html'));
})
app.get('/cover',function(req,res, next){

  res.sendFile(path.join(__dirname, '/public', 'cover.html'));
})
/*
//testing the 'ws' library
//still have to test the concurrent websocket connection limits
app.get('/ws',function(req,res){
  res.sendFile(path.join(__dirname, '/public', 'ws.html'));
});
*/



//testing the mysql concurrent data
app.get('/test',function(req,res){
  res.sendFile(path.join(__dirname, '/public', 'testing.html'));
});

//testing the mysql concurrent data
app.get('/data',function(req,res){
  getCollegeParkingData(function(code, collegeData,parkinglotData){
    res.send(JSON.stringify({code:code, cd : collegeData,pd:parkinglotData},null,'\n'));
  });
});

//testing the mysql concurrent data
app.get('/getPropData',function(req,res){
  getPropData(function(ids, data){
    res.send(JSON.stringify({ids:ids , data : data},null,'\n'));
  });
});

app.get('/codes',function(req,res){
   res.json(codes)
});

var responses = []

app.get('/lpcode',function(req,res){
    responses.push(res)
    console.log(responses.toString())
})

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

  generateCustomKey(function(token){
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

function generateCustomKey(callback){

    var max = Number.MAX_SAFE_INTEGER
    var min = 0
    callback(Math.random() * (max - min) + min)
}


function getCollegeParkingData(callback){
  var initial_data = {};
  var college_data;
  var parkinglot_data;
  var code;
  var query_getCollegeData = "Select * From "+ table_college_info;
  connectionPool.query( query_getCollegeData , function(err,results) {
      if(err){
          console.log("ERROR | checkVersion |  sql query |"+err+"|"+query)

      }
      else{
          var final = {};
          var array = [];
          for(i=0;i < results.length; i++){
              array.push(results[i]['college_id']);
              final[results[i]['college_id']] =
              {
                  college_name : results[i]['college_name'],
                  college_version: results[i]['college_version'],
                  college_coor_lat : results[i]['college_coor_lat'],
                  college_coor_lng : results[i]['college_coor_lng'],
                  college_ride_limit : results[i]['ride_limit'],
                  college_park_limit : results[i]['park_limit']
              };
          }
          final['ids'] = array;
          initial_data['college_data'] = final;
          college_data = final

          var query_getParkingdata = "Select * from "+table_parkinglot_info;
          connectionPool.query(query_getParkingdata, function(err2,results2){
              if(err2){
                  console.log("ERROR | checkVersion |  sql query |"+err2+"|"+query2)
              }
              else{
                  var final2 = {};
                  var array2 = [];
                  for(i=0;i < results2.length; i++){
                      array2.push(results2[i]['parkinglot_id']);

                      var ci = results2[i]['college_id'];
                      var pi = parseInt(results2[i]['parkinglot_id']);

                      var temp2 = {};
                      temp2 =
                      {parkinglot_name : results2[i]['parkinglot_name'],
                      coor_lat : results2[i]['coor_lat'],
                      coor_lng : results2[i]['coor_lng'],
                      college_id : results2[i]['college_id']};
                      final2[pi] = temp2;
                  }
                  final2['ids'] = array2;
                  initial_data['parking_data'] = final2;
                  parkinglot_data = final2;
                  initial_data['code'] = 2;
                  code = 2;
                  callback(code, college_data,parkinglot_data)
              }
          });
      }
  });
}



function getPropData(callback){
  var final = {}
  var ids = []
  var query_get_prop_data = "SELECT * FROM `"+table_connect+"` ORDER BY RAND() LIMIT 10"
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
