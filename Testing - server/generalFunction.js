var serverFunctions = require('./serverFunctions.js');
var vars = require('./variables.js');
var mail = require('./mailFunction.js')
var rs = require('randomstring')
var bcrypt = require('bcrypt');

var codes = {}

var status = {}
var type_forget = {}
var update_type = {}

vars.getStatus(function(s){
  status =s
})

vars.getTypeForget(function(t){
  type_forget =t
})

vars.getUpdateType(function(u){
  update_type =u
})

module.exports = {
  /* Generates a random sring
  primarly used as tokens for general and specific user
  @param {Function} callback - function to call after generating the key
  */
  generateCustomKey:function(size, callback){
    callback(rs.generate(size))
    //callback('50ILoEorxdyCZBPxjeBl')
  },
  generateID:function(callback){
    callback(rs.generate({
      length: 6,
      capitalization: 'uppercase'
    }))
  },
  /* Generates all general codes for the server
  three codes:
  android
  ios
  web
  @param {Function} callback - function to call after generation
  */
  generateCodes:function(callback){
    module.exports.generateCustomKey(20, function(gk){
      codes =
      {general_key:'971Qq4uCyoUYYjeetrrv'};
      console.log("Local Codes Set : ")
      console.log(codes)
      callback(codes)
      /*serverFunctions.updateServerinfo(codes,function(){
        callback(codes)
      })*/

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
    callback()
  },
  /* Checks tokens for general layer
  ensures the http call is encrypting the data with token from the server Codes
  i.e. - checkUsername, resetCredential, createUser
  @param {Request} req - the request data from an HTTP Call
  @param {Response} res - the response var for the HTTP Call results
  @param {Function} callback - function to call IN CASE where then request is encrypted with a general code
  */
  checkReqGeneral:function(req,res,callback){
    console.log("Req General Body:")
    if(codes === null){
      serverFunctions.printError("checkReqGeneral","Error: Internal Server codes not generated yet.",null,null)
      module.exports.structuralError(res,"Internal Error occured sorry")

    }
    else if(req.body.token_gen == undefined){
      serverFunctions.printError("checkReqGeneral","Error: Necessary Parameters not passed",null,req.body)
      module.exports.structuralError(res,"Error: Base Headers/Parameters not met")

    }
    else{
      if(req.body.token_gen == codes['general_key'] ){
        callback(req.body)
      }
      else{
        serverFunctions.printError("checkReqGeneral","Error: Token General Invalid.",null,req.body)
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
            serverFunctions.printError("checkReqSpecific","Error: Token User Invalid.",null,req.body)
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
    module.exports.generateCustomKey(20,function(token){
      serverFunctions.updateUserAuth(user_id,token,function(st,si,token){
        module.exports.handleErrors(res,st,si,function(){
          callback(token)
        })
      })
    });
  },

  attemptCheckUsername:function(res, data, callback){
    if(data.user_name == undefined){
      module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
    }
    else{
      callback(data.user_name)
    }
  },
  checkUsername:function(res, data,callback){
    module.exports.attemptCheckUsername(res,data,function(user_name){
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
    })
  },
  attemptForgot:function(res, data, callback){
    if(data.user_email == undefined || data.type_forget == undefined || type_forget[data.type_forget] == undefined){
      module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
    }
    else{
      callback()
    }
  },
  forgot:function(res, data, callback){
    module.exports.attemptForgot(res, data, function(){
      serverFunctions.getUserIDWithEmail(true, data.user_email, function(struct_err, simple_err, user_id){
        module.exports.handleErrors(res, struct_err, simple_err, function(){
          serverFunctions.getUserData(true, user_id, function(struct_err_2, simple_err_2,user){
            module.exports.handleErrors(res, struct_err_2, simple_err_2, function(){
              if(user.status == status.verify){
                module.exports.simpleError(res,"This email has not been verified yet!\nCheck your inbox.")
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
                  module.exports.generateCustomKey(20, function(newPassword){
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
    })
  },
  attemptUpdateUser:function(res, data, callback){
    if(data.update_type == undefined ||  data.user_name == undefined ||data.user_password == undefined ){
      module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
    }
    else{
      callback()
    }
  },
  updateUser:function(res, data, callback){
    module.exports.attemptUpdateUser(res, data, function(){
      var user_id = data.user_id
      module.exports.handleErrors(res, struct_err, simple_err, function(){
          if(data.update_type === update_type.username){
            module.exports.checkUsername(res,{user_name: data.user_name},function(){
              serverFunctions.updateUsername(user_id, data.user_name, function(uu_struct, uu_simple){
                module.exports.handleErrors(res, uu_struct, uu_simple, function(){
                  callback()
                })
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
  attemptCreateUser:function(res, data, callback){
    if(data.user_name == undefined ||data.user_password == undefined ||data.user_email == undefined ){
      module.exports.structuralError(res,"Error.Base Headers/Parameters not met")
    }
    else{
      callback()
    }
  },
  createUser:function(res, data, callback){
    module.exports.attemptCreateUser(res, data, function(){
      console.log("CU Attempt Good")
      serverFunctions.getUserIDWithEmail(false, data.user_email,function(struct, simple){
        if(struct){
          module.exports.structuralError(res, "An Error occured")
        }
        else if(simple){
          console.log("CU Unused Email")
          serverFunctions.checkUsername(data.user_name,function(cu_st, cu_si){
            console.log("CU Username unused")
            module.exports.handleErrors(res, cu_st, cu_si, function(){
              module.exports.generateUserID(res, function(user_id){
                console.log("CU Generated Username")
                bcrypt.genSalt(10, function(salt_err, salt) {
                  bcrypt.hash(user_id+""+data.user_password, salt, function(has_err, hash) {
                    module.exports.generateCustomKey(20, function(verification_key){
                      var new_user_data = {
                        user_id:user_id,
                        user_name:data.user_name,
                        user_password:hash,
                        user_email:data.user_email,
                        user_verification_key:verification_key
                      }
                      serverFunctions.createUser(new_user_data,function(struct_err, simple_err){
                        console.log("CU created User")
                        module.exports.handleErrors(res, struct_err, simple_err, function(){
                          console.log("CU No errors")
                          mail.sendWelcomeemail(new_user_data,new_user_data.user_email, function(sm_struct, sm_simple){
                            console.log("Send welcome mail")
                            module.exports.handleErrors(res, sm_struct, sm_simple, function(){
                              console.log("CU no errors")
                              callback()
                            })
                          })
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
    })
  },
  generateUserID:function(res,callback){
    module.exports.generateID(function(user_id){
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
  verify:function(res, req, callback){
    module.exports.attemptVerify(req,res, function(data){
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
