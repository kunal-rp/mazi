var serverFunctions = require('./serverFunctions.js');
var jwt = require('jsonwebtoken')

var codes = {}
var public_key = "Vierve"

module.exports = {
  setCodes:function(c){
    codes = c
  },
  generateCustomKey:function(callback){

    var max = Number.MAX_SAFE_INTEGER
    var min = 0
    callback((Math.random() * (max - min) + min).toString())
  },
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
    checkReqGeneral:function(req,res,callback){
      if(req.get("token_gen") == undefined ||req.get("type") == undefined || codes[req.get("type")] == undefined){
        module.exports.strucuralError(res,"Error: Base Headers/Parameters not met")
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
    checkReqBasic:function(req,res,callback){
      if(req.get("token_gen") == undefined ){
        module.exports.strucuralError(res,"Error.Base Headers/Parameters not met")
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
    checkReqSpecific:function(req,res,callback){
      module.exports.checkReqGeneral(req, res,function(result){
        if(result.user_id === undefined || req.get("token_specific") == undefined){
          module.exports.strucuralError(res,"Error.Base Headers/Parameters not met")
          console.log("checkReqSpecific")
          console.log("Error: user_id value not found in token_gen")
          console.log()
        }
        else{
          var user_id = result.user_id
          serverFunctions.getUserData(user_id, function(err, user){
            if(err){
              module.exports.strucuralError(res, "An Error Occured . Sorry for the inconvenience");
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
                  callback(user_id, result2)
                }
              })
            }
          })
        }
      })
    },

    ckeckDataSuggestion:function(req, res, data){
      if(data.type == undefined ||data.system_data == undefined ||data.comment == undefined ){
          module.exports.strucuralError(res,"Error.Base Headers/Parameters not met")
      }
    },

    strucuralError:function(res,message,data={}){
      res.json({code: -1, message: message,data:data});
    },

    simpleError:function(res,message,data={}){
      res.json({code: 0, message: message,data:data});
    },

    validResponse:function(res, message,data={}){
      res.json({code: 1, message: message,data:data});
    }


  }
