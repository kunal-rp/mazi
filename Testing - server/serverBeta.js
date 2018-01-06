var express = require('express');
const bcrypt = require('bcrypt');//Encrypting passwords and generating hashes for email verification
var path = require('path');
var jwt = require('jsonwebtoken')
var WebSocketServer = require("ws").Server
var cors = require('cors');
var bodyParser = require('body-parser')

var serverFunctions = require('./serverFunctions.js');
var db = require('./DBPoolConnection.js')
var connectionPool = db.getPool();
var gen = require('./generalFunction.js')
var action = require('./actionFunctions.js')

//Ensures server continues to run if any exception occurs. Will have to come up with a better system in the future
process.on('uncaughtException', function (err) {
  console.log(err);
});
var port = 3000
app = express();



var server = app.listen(port,'0.0.0.0');

app.use(express.static('public'));

//support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

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

app.post('/login',function(req,res){
  //checks if data is encrypted with general codes and user specific token
  gen.checkReqGeneral(req, res, function(data){
    action.loginUser(res, data)
  })
});

app.post('/logoff',function(req, res){
  gen.checkReqSpecific(req, res, function(data){
    action.logoffUser(res, data)
  })
})

app.post('/createUser',function(req, res){
  gen.checkReqGeneral(req, res, function(data){
    gen.attemptCreateUser(res, data, function(){
      gen.createUser(res, data, function(){
        gen.validResponse(res, "User Account created!\nPlease check your email to verify your account!")
      })
    })
  })
})

app.get('/verify',function(req, res){
  gen.attemptVerify(req, res, function(data){
    gen.verify(res, data, function(struct, simple){
      if(struct || simple){
        res.sendFile(path.join(__dirname, '/public', 'error.html'));
      }
      else{
        res.sendFile(path.join(__dirname, '/public', 'verifyEmail.html'));
      }
    })
  })
})

app.post('/checkusername',function(req,res){
  //checks if data is encrypted with general codes and user specific token
  gen.checkReqGeneral(req, res, function(data){
    //checks if request / user has correct permissions
    gen.attemptCheckUsername(res, data, function(user_name){
      //checks if username is in use
      gen.checkUsername(res, user_name, function(){
        gen.validResponse(res, "Username is avalible")
      })
    })
  })
})

app.post('/reset',function(req,res){
  //checks if data is encrypted with general codes and user specific token
  gen.checkReqGeneral(req,res,function(data){
    //checks for data strucutre and parameters
    gen.attemptReset(res, data, function(){
      //resets the user
      gen.resetUser(res, data, function(){
        gen.validResponse(res, "User Reset Confirmed")
      })
    })
  })
})

app.post('/action',function(req, res){
  gen.checkReqSpecific(req, res, function(data){
    action.handleAction(res, data)
  })
})

app.post('/updateUser',function(req, res){
  gen.checkReqSpecific(req, res, function(data){
    gen.attemptUpdateUser(res, data, function(){
      gen.updateUser(res, data, function(){
        gen.validResponse(res, "User Profile Updated")
      })
    })
  })
})
//Change
app.post('/addSuggestion',function(req,res){
  gen.checkReqSpecific(req,res,function(data){
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
