var express = require('express');
var bcrypt = require('bcrypt');//Encrypting passwords and generating hashes for email verification
var path = require('path');
var bodyParser = require('body-parser')

var serverFunctions = require('./serverFunctions.js');
var db = require('./DBPoolConnection.js')
var connectionPool = db.getPool();
var gen = require('./generalFunction.js')
var action = require('./actionFunctions.js')

//Ensures server continues to run if any exception occurs. Will have to come up with a better system in the future
process.on('uncaughtException', function (err) {
  serverFunctions.printError("Error Occured",null,err,null)
  console.log("An undefined error occured in runtime");
  console.log()
});

var port = 3000
app = express();

var server = app.listen(process.env.PORT || 3000);

app.use(express.static('public'));

//support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

var codes;

gen.generateCodes(function(data){
  codes = data;
});

app.get('/',function(req,res, next){
  res.sendFile(path.join(__dirname, '/public', 'index.html'));
})

/*
User will recieve the general token that they will use for verification
*/
app.get('/codes',function(req,res){
  console.log("Codes Requested")
  gen.checkReqBasic(req, res, function(){
    res.json(codes)
  })
});

/*
The following calls are all GENERAL CALLS
These calls handle all operations not related to the parking ; mainly handling user events
Types of Verification Type:
  GENERAL : reqires the general token in 'codes' as 'token_gen' in post variable
  Specific : reqires user specific token recieved during log in
*/

/*
GENERAL
checks if username is avalible to use

params :
  user_name : the username that we would like to check if avalible

responses:
  -1 : invalid structural
   0 : username taken
   1 : username avalible
*/
app.post('/checkusername',function(req,res){
  gen.checkReqGeneral(req, res, function(data){
    gen.checkUsername(res, data, function(){
      gen.validResponse(res, "Username is avalible")
    })
  })
});

/*
GENERAL
in cases where the username or password is forgotten

params :
  user_email : email of user
  type_forget : the type of forget event
    -username
    -password

responses:
  -1 : invalid structural
   0 : simple error
    -user'e email is not verified
   1 : an email was sent with necessary credentials
*/

app.post('/forgot',function(req,res){
  gen.checkReqGeneral(req,res,function(data){
    gen.forgot(res, data, function(){
      gen.validResponse(res, "Forgot Credential Operations Completed")
    })
  })
})

app.post('/createUser',function(req, res){
  gen.checkReqGeneral(req, res, function(data){
    gen.createUser(res, data, function(){
      gen.validResponse(res, "User Account created!\nPlease check your email to verify your account!")
    })
  })
})

app.get('/verify',function(req, res){
  gen.verify(res,req, function(struct, simple){
    if(struct || simple){
      res.sendFile(path.join(__dirname, '/public', 'error.html'));
    }
    else{
      res.sendFile(path.join(__dirname, '/public', 'verifyEmail.html'));
    }
  })
})

app.post('/updateUser',function(req, res){
  gen.checkReqSpecific(req, res, function(data){
    gen.updateUser(res, data, function(){
      gen.validResponse(res, "User Profile Updated")
    })
  })
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

app.post('/action',function(req, res){
  gen.checkReqSpecific(req, res, function(data){
    action.handleAction(res, data)
  })
})

app.post('/login',function(req,res){
  gen.checkReqGeneral(req, res, function(data){
    action.loginUser(res, data,function(msg, d){
      gen.validResponse(res, msg, d)
    })
  })
});

app.post('/logoff',function(req, res){
  gen.checkReqSpecific(req, res, function(data){
    action.logoffUser(res, data)
  })
})

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
