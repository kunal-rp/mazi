var serverFunctions = require('./serverFunctions.js');
var jwt = require('jsonwebtoken')
var mail = require('./mailFunction.js')
var rs = require('randomstring')
const bcrypt = require('bcrypt');//Encrypting passwords and generating hashes for email verification

var codes = null
var public_key = "Vierve"

var status = {
  verify_email:'verify_email',
  not:'-',
  idle:'idle',
  waiting:'waiting',
  inmatch:'match',
  rate:'rate',
}

var type_forget = {
  username:"username",
  password:"password"
}

var update_type = {
  username:"username",
  password:"password"
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
    //callback(rs.generate(20))
    callback('50ILoEorxdyCZBPxjeBl')
  },
  /* Generates all general codes for the server
  three codes:
  android
  ios
  web
  @param {Function} callback - function to call after generation
  */
  generateCodes:function(callback){
    module.exports.generateCustomKey(function(gk){
      var codes =
      {general_key:gk};
      serverFunctions.updateServerinfo(codes,function(){
        callback(codes)
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
          serverFunctions.printError("checkReqBasic","Error: Error: Session Token Invalid.",err,null)
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
    if(codes === null){
      serverFunctions.printError("checkReqGeneral","Error: Internal Server codes not generated yet.",null,null)
      module.exports.structuralError(res,"Internal Error occured sorry")

    }
    else if(req.body.token_gen === undefined || req.body.token_gen != codes['general_key']){
      serverFunctions.printError("checkReqGeneral","Error: Necessary Parameters not passed",null,null)
      module.exports.structuralError(res,"Error: Base Headers/Parameters not met")

    }
    else{
      if(req.body.token_gen == codes['general_key'] ){
        callback(req.body)
      }
      else{
        serverFunctions.printError("checkReqGeneral","Error: Token General Invalid.",null,null)
        module.exports.structuralError(res,"Error: Token General Invalid.")
      }
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
    if(req.body.user_id == undefined || req.body.token_user == undefined){
      serverFunctions.printError("checkReqSpecific","Error: Base Headers/Parameters not met",null,null)
      module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
    }
    else{
      var user_id = req.body.user_id
      serverFunctions.getUserData(true, user_id, function(struct_err,simple_err, user){
        module.exports.handleErrors(res,struct_err,simple_err,function(){
          if(req.body.token_user == user.auth_token){
            callback(req.body)
          }
          else{
            serverFunctions.printError("checkReqSpecific","Error: Token User Invalid.",null,null)
            module.exports.simpleError(res,"Error: Token User Invalid.")
          }
        })
      })
    }

  },
  /* Updates the user's authentication token
  ensures the http call is encrypting the data with token from the server Codes
  i.e. - checkUsername, resetCredential, createUser
  @param {String} user_id - the user's unique ID
  @param {Function} callback - function to call IN CASE where then toekn is updated
  */
  updateUserAuth:function(res,user_id, callback){
    module.exports.generateCustomKey(function(token){
      serverFunctions.updateUserAuth(user_id,token,function(error, token){
        if(error){
          module.exports.structuralError(res, error)
        }
        else{
          callback(token)
        }
      })
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
  attemptCheckUsername:function(res, data, callback){
    if(data.user_name == undefined){
      module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
    }
    else{
      callback(data.user_name)
    }
  },
  checkUsername:function(res, user_name,callback){
    serverFunctions.checkUsername(user_name, function(struc_err, simple_err){
      if(struc_err){
        module.exports.structuralError(res,struc_err)
      }
      else if(simple_err){
        module.exports.simpleError(res,simple_err)
      }
      else{
        callback(user_name)
      }
    })
  },
  attemptReset:function(res, data, callback){
    if(data.user_email == undefined || data.type_forget == undefined ){
      module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
    }
    else{
      callback()
    }
  },
  resetUser:function(res, data, callback){
    serverFunctions.getUserIDWithEmail(true, data.user_email, function(struct_err, simple_err, user_id){
      module.exports.handleErrors(res, struct_err, simple_err, function(){

        serverFunctions.getUserData(true, user_id, function(struct_err_2, simple_err_2,user){
          module.exports.handleErrors(res, struct_err_2, simple_err_2, function(){
            if(user.status == status.verify){
              module.exports.simpleError(res,"This email has not been verified yet!\nCheck for an email form us to this address.")
            }
            else{
              //forgot username
              if(data.type_forget === type_forget.username){
                serverFunctions.getUsernameWithUserID(user_id, function(struct_err_3, simple_err_3, user_name){
                  module.exports.handleErrors(res, struct_err_3, simple_err_3, function(){
                    mail.sendForgotUsernameEmail({user_name: user_name},data.user_email,function(struct_err_4, simple_err_4){
                      module.exports.handleErrors(res, struct_err_4, simple_err_4, function(){
                        callback()
                      })
                    })
                  })
                })
              }
              //forgot password
              else{
                module.exports.generateCustomKey(function(newPassword){
                  module.exports.updatePassword(res,user_id,newPassword, function(){
                    mail.sendForgotPasswordEmail({newPassword:newPassword},data.user_email, function(sm_struct, sm_simple){
                      module.exports.handleErrors(res, sm_struct, sm_simple, function(){
                        callback()
                      })
                    })
                  })
                })
              }
            }
          })
        })
      })
    })
  },
  attemptUpdateUser:function(res, data, callback){
    if(data.update_type == undefined ||  data.user_name == undefined ||data.user_password == undefined ||data.user_email == undefined){
      module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
    }
    else{
      callback()
    }
  },
  updateUser:function(res, data, callback){
    serverFunctions.getUserIDWithEmail(true, data.user_email, function(struct_err, simple_err, user_id){
      module.exports.handleErrors(res, struct_err, simple_err, function(){
        if(data.update_type === update_type.username){
          serverFunctions.updateUsername(user_id, data.user_name, function(uu_struct, uu_simple){
            module.exports.handleErrors(res, uu_struct, uu_simple, function(){
              callback()
            })
          })
        }
        else if(data.update_type === update_type.password){

          module.exports.updatePassword(res,user_id,data.user_password, function(){
            callback()
          })
        }
      })
    })
  },

  updatePassword:function(res,user_id, newPassword,callback){
    bcrypt.genSalt(10, function(salt_err, salt){
      module.exports.handleErrors(res, salt_err, false, function(){
        bcrypt.hash(user_id+""+newPassword, salt, function(hash_err, hash) {
          module.exports.handleErrors(res, hash_err, false, function(){
            serverFunctions.updatePassword(user_id, hash, function(up_struct, up_simple){
              module.exports.handleErrors(res, up_struct, up_simple, function(){
                callback()
              })
            })
          })
        })
      })
    })
  },
  checkEmail:function(res, email,callback){
    mail.validateEmail(email, function(err){
      if(err){
        module.exports.handleErrors(res, err, false, function(){})
      }
      else{
        callback()
      }

    })
  },

  attemptCreateUser:function(res, data, callback){
    if(data.user_name == undefined ||data.user_password == undefined ||data.user_email == undefined || data.promo_user == undefined ){
      module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
    }
    else{
      callback()
    }
  },
  createUser:function(res, data, callback){
    serverFunctions.getUserIDWithEmail(false, data.user_email,function(struct, simple){
      if(struct){
        module.exports.structuralError(res, "An Error occured")
      }
      else if(simple){
        module.exports.generateUserID(res, function(user_id){
          bcrypt.genSalt(10, function(salt_err, salt) {
            bcrypt.hash(user_id+""+data.user_password, salt, function(has_err, hash) {
              module.exports.generateCustomKey(function(verification_key){
                var new_user_data = {
                  user_id:user_id,
                  user_name:data.user_name,
                  user_password:hash,
                  user_email:data.user_email,
                  user_verification_key:verification_key
                }
                serverFunctions.createUser(new_user_data,function(struct_err, simple_err){
                  module.exports.handleErrors(res, struct_err, simple_err, function(){
                    mail.sendWelcomeemail(new_user_data,new_user_data.user_email, function(sm_struct, sm_simple){
                      module.exports.handleErrors(res, sm_struct, sm_simple, function(){
                        callback()
                      })
                    })
                  })
                })
              })
            })
          })
        })
      }
      else{
        module.exports.simpleError(res, "An account with that email is already registered.")
      }
    })
  },
  generateUserID:function(res,callback){
    var user_id =  (Math.floor(Math.random() * 16777216)+1).toString(16).toUpperCase();
    serverFunctions.getUserData(false, user_id, function(struct, simple){
      if(struct){
        module.exports.structuralError(res, "An Error occured")
      }
      else if(simple){
        callback(user_id)
      }
      else{
        module.exports.generateUserID(res, callback)
      }

    })
  },
  attemptVerify:function(req, res, callback){
    if(req.query.user_name == undefined ||req.query.code == undefined ){
      module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
    }
    else{
      callback({user_name:req.query.user_name, code:req.query.code})
    }
  },
  verify:function(res, data, callback){
    serverFunctions.checkUsername(data.user_name, function(struct, simple){
      if(struct){
        callback(struct,false)
      }
      else{
        serverFunctions.verify(data, function(st2, si2){
          if(st2 || si2){
            callback(st2,si2)
          }
          else{
            callback(false, false)
          }
        })
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
  },
  handleErrors:function(res, struct, simple, callback){
    if(struct){
      module.exports.structuralError(res,struct)
    }
    else if(simple){
      module.exports.simpleError(res,simple)
    }
    else{
      callback()
    }
  }

}
