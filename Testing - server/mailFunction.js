var nodemailer = require('nodemailer');//sending mail
var validator = require('mailgun-email-validation');


var transporter = nodemailer.createTransport( {
    service:  'Mailgun',
    auth: {
        user: 'postmaster@vierve.com',
        pass: 'El65ZPAjjNcqp2VaTDQ5'
    }
});

var url = "https://viervetesting.herokuapp.com"

/*

var mailOpts = {
    from:'noreply@vierve.com',
    to: data.user_email,
    subject: 'Email Verification',
    html : '<h1>Welcome to Vierve @'+data.user_name+'!</h1> <p>Click the link below to activate your account.</p><a href="https://server.vierve.com/verifyEmail?user_name='+data.user_name+'&hash='+data.main_salt+'">Click Here </a><p></p>'
};

transporter.sendMail(mailOpts, function (err2, response) {
    if (err2) {
        console.log("ERROR | resetCredential |  sending email | "+err2)

    } else {
        console.log(" resetCredential | forgotUsernameEmailSent | "+user_email + " - "+user_name)
    }
})

validator.check(req.query.user_email , function(valid_email_err, valid) {
    if (valid_email_err){
        console.log("ERROR | createUser | validate email | "+valid_email_err)
        res.json({code:0,message:"Validating Email Error"});
    }
    else{
        if(valid == false){
            res.json({code:0,message:"Invalid Email"});
            console.log("createUser | invalid email")
        }
    }
  })

*/



module.exports = {

  validateEmail:function(email, callback){
    validator.check(email , function(err, valid){
        if(err){
          callback(err)
        }
        else{
          callback(false)
        }
      })
  },
  sendMail:function(email, subject, html, callback){
    module.exports.validateEmail(email, function(err){
      if(err){
        callback(false, "This email is invalid")
      }
      else{
        var mailOpts = {
            from:'noreply@vierve.com',
            to: email,
            subject: subject,
            html :  html
        }
        transporter.sendMail(mailOpts, function (send_mail_err, send_mail_result) {
            if (send_mail_err) {
                callback(send_mail_err)

            } else {
              console.log("mail sent")
                callback(false, false)
            }
        })
      }
    })
  },
  sendWelcomeemail:function(data, email, callback){
    var subject = 'Welcome from Vierve!'
    var html = '<h1>Welcome to Vierve @'+data.user_name+'!</h1> <p>Click the link below to activate your account.</p><a href="'+url+'?user_name='+data.user_name+'&code='+data.user_verification_key+'">Click Here </a><p></p>'
    module.exports.sendMail(email,subject, html, callback)
  },
  sendForgotUsernameEmail:function(data, email, callback){
    var subject = 'Vierve - Forgot Username'
    var html =  '<h1>You indicated that you forgot your username!</h1> <p>Here is your username : @'+data.user_name+'</p>'
    module.exports.sendMail(email,subject, html, callback)
  },
  sendForgotPasswordEmail:function(data, email, callback){
    var subject = 'Vierve - Forgot Password'
    var html = '<h1>You indicated that you forgot your password!</h1> <p>Here is your new password  : '+data.newPassword+'</p><p>Make sure to Reset your password after logging in</p>'
    module.exports.sendMail(email,subject, html, callback)

  }



}
