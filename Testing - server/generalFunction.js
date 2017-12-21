var serverFunctions = require('./serverFunctions.js');
var jwt = require('jsonwebtoken')

var codes = {}
var public_key = "Vierve"

var status = {
  not:'-',
  idle:'idle',
  waiting:'waiting',
  inmatch:'match',
  rate:'rate'
}

module.exports = {
  setCodes:function(c){
    codes = c
  },

  /* Generates a random sring
  primarly used as tokens for general and specific user
  @param {Function} callback - function to call after generating the key
  */
  generateCustomKey:function(callback){
    var max = Number.MAX_SAFE_INTEGER
    var min = 0
    callback((Math.random() * (max - min) + min).toString())
  },
  /* Generates all general codes for the server
  three codes:
    android
    ios
    web
  @param {Function} callback - function to call after generation
  */
  generateCodes:function(callback){
    module.exports.generateCustomKey(function(v_a){
      module.exports.generateCustomKey(function(v_i){
        module.exports.generateCustomKey(function(v_w){
          var codes =
          {android_key:v_a,
            ios_key:v_i,
            web_key:v_w};
            serverFunctions.updateServerinfo(codes,function(){callback(codes)})
          })
        })
      })
    },
    /* Checks tokens at basic level
    for http calls that retreive basic information
      i.e. - checkAppVersion
    @param {Request} req - the request data from an HTTP Call
    @param {Response} res - the response var for the HTTP Call results
    @param {Function} callback - function to call IN CASE where then request is encrypted with the basic codes
    */
    checkReqBasic:function(req,res,callback){
      if(req.get("token_gen") == undefined ){
        module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
      }
      else{
        jwt.verify(req.get("token_gen"),public_key , function(err, result) {
          if(err){
            module.exports.simpleError(res,"Error: Session Invalid.")
            console.log("checkReqBasic")
            console.log("Error: Error: Session Invalid.")
            console.log("Public Key: "+public_key)
            console.log(err)
            console.log()
          }
          else{
            callback(result)
          }
        })
      }
    },
    /* Checks tokens for general layer
    ensures the http call is encrypting the data with token from the server Codes
      i.e. - checkUsername, resetCredential, createUser
    @param {Request} req - the request data from an HTTP Call
    @param {Response} res - the response var for the HTTP Call results
    @param {Function} callback - function to call IN CASE where then request is encrypted with a general code
    */
    checkReqGeneral:function(req,res,callback){
      if(req.get("token_gen") == undefined ||req.get("type") == undefined || codes[req.get("type")] == undefined){
        module.exports.structuralError(res,"Error: Base Headers/Parameters not met")
        console.log("checkReqGeneral")
        console.log("Error: Base Headers/Parameters not met")
        console.log()
      }
      else{
        jwt.verify(req.get("token_gen"), codes[req.get("type")], function(err, result) {
          if(err){
            module.exports.simpleError(res,"Error: Session Invalid.")
            console.log("checkReqGeneral")
            console.log("Error: Error: Session Invalid.")
            console.log("Type: "+req.get("type"))
            console.log(err)
            console.log()
          }
          else{
            callback(result)
          }
        })
      }
    },
    /* Checks tokens for user specific layer
    ensures the http call is encrypting the data with token from the user authentication token
      i.e. - addSuggestion, updateUser
    @param {Request} req - the request data from an HTTP Call
    @param {Response} res - the response var for the HTTP Call results
    @param {Function} callback - function to call IN CASE where then request is encrypted with a general code
    */
    checkReqSpecific:function(req,res,callback){
      module.exports.checkReqGeneral(req, res,function(result){
        if(result.user_id === undefined || req.get("token_specific") == undefined){
          module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
          console.log("checkReqSpecific")
          console.log("Error: user_id value not found in token_gen")
          console.log()
        }
        else{
          var user_id = result.user_id
          serverFunctions.getUserData(user_id, function(err, user){
            if(err){
              module.exports.structuralError(res, "An Error Occured . Sorry for the inconvenience");
              console.log("checkReqSpecific")
              console.log("Error: occured when getting the user data for the user id :"+user_id)
              console.log(err)
              console.log()
            }
            else{
              jwt.verify(req.get("token_specific"), user.auth_code , function(err2, result2) {
                if(err2){

                  module.exports.simpleError(res,"Error: Session Invalid.")
                  console.log("checkReqSpecific")
                  console.log("Error: Error: Session Invalid.")
                  console.log("Invalid auth token:"+user_id)
                  console.log(err2)
                  console.log()
                }
                else{
                  result2.user_id = user_id
                  callback(result2)
                }
              })
            }
          })
        }
      })
    },
    /* Updates the user's authentication token
    ensures the http call is encrypting the data with token from the server Codes
      i.e. - checkUsername, resetCredential, createUser
    @param {String} user_id - the user's unique ID
    @param {Function} callback - function to call IN CASE where then toekn is updated
    */
    updateUserAuth:function(user_id, callback){
      module.exports.generateCustomKey(function(token){
        serverFunctions.updateUserAuth(user_id,token,callback)
      });
    },

    attemptLogin:function(res,data, callback){
      if(data.user_name == undefined ||data.user_password == undefined ){
          module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
      }
      else{
        serverFunctions.attemptLogin(data.user_name, data.user_password, function(structural_error,simple_error,user_id){
          if(structural_error){
            module.exports.structuralError(res, structural_error)
          }
          else if(simple_error){
            module.exports.simpleError(res, simple_error)
          }
          else{
            console.log("Login Sucsessful :"+user_id)
            callback(user_id)
          }
        })
      }
    },
    loginUser(res, user_id, callback){
      serverFunctions.updateUserStatus(user_id, status.idle, function(error){
        if(error){
          module.exports.structuralError(res, error)
        }
        else{
          callback()
        }
      })
    },

    /* HTTP response when there is a structural issue with the request
      i.e. - all necessary data headers are not provided, the token encryption is invalid
    @param {Response} res - the http response variable
    @param {String} message - the text to pass in
    @param {JSON} data - any other data to return back
    */
    structuralError:function(res,message="Error.Base Headers/Parameters not met",data={}){
      res.json({code: -1, message: message,data:data});
    },
    /* HTTP response when there is a simple error from the HTTP request
      i.e. - the passed in data version is incorrect
    @param {Response} res - the http response variable
    @param {String} message - the text to pass in
    @param {JSON} data - any other data to return back
    */
    simpleError:function(res,message="Invalid",data={}){
      res.json({code: 0, message: message,data:data});
    },
    /* HTTP response when there is a sucsessful response to a HTTP Request
      i.e. - a suggestion has been recorded
    @param {Response} res - the http response variable
    @param {String} message - the text to pass in
    @param {JSON} data - any other data to return back
    */
    validResponse:function(res, message="Valid",data={}){
      res.json({code: 1, message: message,data:data});
    }
  }
