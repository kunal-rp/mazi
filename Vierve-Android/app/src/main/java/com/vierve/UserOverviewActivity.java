package com.vierve;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.content.Context;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.util.AttributeSet;
import android.util.JsonReader;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.vision.text.Text;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.security.Key;

import javax.crypto.spec.SecretKeySpec;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

/**
 * Created by kunal on 9/13/17.
 */

public class UserOverviewActivity extends AppCompatActivity {


    JSONObject user = new JSONObject();


    EditText username_view ;
    TextView email_view;
    EditText current_password;
    EditText new_password;
    EditText confirm_new_password;


    //Progress Circle Objects
    private View mProgressView;
    private View mLoginFormView;

    SocketHandler socketHandler;

    Db_Helper_User db_helper_user;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_user_overview);

        socketHandler = new SocketHandler();


        mLoginFormView = findViewById(R.id.login_form);
        mProgressView = findViewById(R.id.login_progress);

        username_view = (EditText) findViewById(R.id.username_view);
        email_view = (TextView) findViewById(R.id.email_view);
        current_password = (EditText) findViewById(R.id.current_password);
        new_password = (EditText) findViewById(R.id.new_password);
        confirm_new_password = (EditText) findViewById(R.id.confirm_new_password);

        //DB User Info handler
        db_helper_user = new Db_Helper_User(this,null);

        try {
            user = db_helper_user.getInfo();
            username_view.setText(user.getString("user_name"));
            email_view.setText(user.getString("user_email"));
        } catch (JSONException e) {
            e.printStackTrace();
        }

        Button updateUsername = (Button) findViewById(R.id.update_username_btn);
        updateUsername.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {


                runCheckUsername();
            }
        });

        Button updatePassword = (Button) findViewById(R.id.update_password_btn);
        updatePassword.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                try {
                    runCheckPassword();
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        });
    }

    public static boolean isValidPasswordMatch(String password1, String password2) {
        return password1.equals(password2);
    }

    public boolean isCorrectPassword(String password) throws JSONException {
        return user.getString("user_password").equals(password);
    }

    public static boolean isValidPassword(String password1) {
        return password1.length() > 0 ;
    }


    public void runCheckPassword() throws JSONException {
        current_password.setError(null);
        new_password.setError(null);
        confirm_new_password.setError(null);
        if(isCorrectPassword(current_password.getText().toString()) && isValidPassword(new_password.getText().toString()) && isValidPasswordMatch(new_password.getText().toString(),confirm_new_password.getText().toString())){
            showProgress(true);
            new Updateuser().execute(user.getString("user_name"),current_password.getText().toString(),new_password.getText().toString(),user.getString("user_email"),user.getString("user_id"));
        }
        else{
            showProgress(false);
            if(!isCorrectPassword(current_password.getText().toString())){
                MyLogger.d("KTag","Wrong Password");
                current_password.setError("Wrong Password");
                current_password.requestFocus();
            }else if(!isValidPassword(new_password.getText().toString())){
                MyLogger.d("KTag","Invalid New Password");
                new_password.setError("Invalid Password");
                new_password.requestFocus();
            }
            else if(isValidPasswordMatch(new_password.getText().toString(),confirm_new_password.getText().toString())){
                MyLogger.d("KTag","Password Don't match");
                confirm_new_password.setError("Invalid Password");
                confirm_new_password.requestFocus();
            }
        }
    }

    public  boolean isvalidUsername(String username)  {
        MyLogger.d("KTag","Username length : "+username.length());
        MyLogger.d("KTag","Username "+username);
        for(int i =0 ; i < username.length(); i++){
            if(!Character.isLetter(username.charAt(i)) && !Character.isDigit(username.charAt(i)) && username.charAt(i) != '.' && username.charAt(i) != '_'){
                MyLogger.d("KTag","Punc @ "+i);
                return false;
            }
        }

        return username.length() > 2 && username.length() <16 ;
    }




    public void runCheckUsername() {
        username_view.setError(null);

        if (isvalidUsername(username_view.getText().toString()) ) {
            MyLogger.d("KTag", "Valid Username credentials");
            showProgress(true);
            new CheckUsername().execute(username_view.getText().toString());
        } else {
            showProgress(false);
            MyLogger.d("KTag", "Invalid Username");
            username_view.setError("Invalid Username");
            username_view.requestFocus();

        }
    }

    /*
       Async task that calles REST API to first get the current data version number from db_helper_data
       Then passes that into the 'checkVersion' URL
        */
    private class CheckUsername extends AsyncTask<Object, Object, Void> {

        String new_user_name ;

        JSONObject resultJSON;
        String message;

        byte[] encodeData = new String(socketHandler.getDefaultKey()).getBytes();
        Key key_data = new SecretKeySpec(encodeData, SignatureAlgorithm.HS256.getJcaName());

        @Override
        protected Void doInBackground(Object... args) {
            try {
                new_user_name = args[0].toString();
                MyLogger.d("KTag",new String(socketHandler.getDefaultKey()));
                String token_data = Jwts.builder().claim("user_name",new_user_name).signWith(SignatureAlgorithm.HS256, key_data).compact();
                //REST API url ; calls db method to get the largest verison
                String urlstring = socketHandler.getURL() + "/checkUsername" ;
                MyLogger.d("KTag",urlstring);
                MyLogger.d("KTag", "Check Username REST API check");
                URL versionUrl = new URL(urlstring);
                HttpURLConnection myConnection = (HttpURLConnection) versionUrl.openConnection();
                myConnection.setRequestProperty("user_type", "vierve_android");
                myConnection.setRequestProperty("token", token_data);
                if (myConnection.getResponseCode() == 200) {
                    InputStream responseBody = myConnection.getInputStream();
                    InputStreamReader responseBodyReader = new InputStreamReader(responseBody, "UTF-8");
                    JsonReader jsonReader = new JsonReader(responseBodyReader);
                    String var = getStringFromInputStream(responseBody);
                    resultJSON = new JSONObject(var);
                    MyLogger.d("KTag", "Sucsessful http REST API");

                } else {
                    MyLogger.d("KTag", "Error");
                }

            } catch (IOException e) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(getApplicationContext(),"Cannot establish connection to Server for Check User",Toast.LENGTH_LONG).show();

                    }
                });
                e.printStackTrace();
            } catch (JSONException e) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(getApplicationContext(),"Can't put Check User results into JSON Object",Toast.LENGTH_LONG).show();
                    }
                });
                e.printStackTrace();
            }
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {


            try {
                switch(resultJSON.getInt("code")){
                    case 0 :
                        showProgress(false);
                        message = resultJSON.getString("message");
                        Toast.makeText(getApplicationContext(),message,Toast.LENGTH_SHORT).show();
                        showProgress(false);
                        break;
                    case 1:
                        showProgress(true);
                        new Updateuser().execute(new_user_name,user.getString("user_password"),user.getString("user_password"),user.getString("user_email"),user.getString("user_id"));
                        break;
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }

        }
    }





    private class Updateuser extends AsyncTask<Object, Object, Void> {

        JSONObject resultJSON;
        String message;

        byte[] encodeUserID = new String(socketHandler.getDefaultKey()).getBytes();
        byte[] encodeData = new String(socketHandler.getUserKey()).getBytes();
        Key key_userid = new SecretKeySpec(encodeUserID, SignatureAlgorithm.HS256.getJcaName());
        Key key_data = new SecretKeySpec(encodeData, SignatureAlgorithm.HS256.getJcaName());

        @Override
        protected Void doInBackground(Object... args) {
            try {
                String token_user = Jwts.builder().claim("user_id",user.getString("user_id")).signWith(SignatureAlgorithm.HS256, key_userid).compact();
                String token_data = Jwts.builder().claim("new_user_name",args[0]).claim("user_password",args[1]).claim("new_user_password",args[2]).claim("user_email",args[3]).claim("user_id",args[4]).signWith(SignatureAlgorithm.HS256, key_data).compact();


                //REST API url ; calls db method to get the largest verison
                String urlstring = socketHandler.getURL() + "/updateUser";
                MyLogger.d("KTag",urlstring);
                MyLogger.d("KTag", "Update Username REST API check");
                URL versionUrl = new URL(urlstring);
                HttpURLConnection myConnection = (HttpURLConnection) versionUrl.openConnection();
                myConnection.setRequestProperty("user_type", "vierve_android");
                myConnection.setRequestProperty("token_user", token_user);
                myConnection.setRequestProperty("token_data", token_data);
                if (myConnection.getResponseCode() == 200) {
                    InputStream responseBody = myConnection.getInputStream();
                    InputStreamReader responseBodyReader = new InputStreamReader(responseBody, "UTF-8");
                    JsonReader jsonReader = new JsonReader(responseBodyReader);
                    String var = getStringFromInputStream(responseBody);
                    resultJSON = new JSONObject(var);
                    MyLogger.d("KTag", "Sucsessful http REST API");

                } else {
                    MyLogger.d("KTag", "Error");
                }

            } catch (IOException e) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(getApplicationContext(),"Cannot establish connection to Server for Check User",Toast.LENGTH_LONG).show();

                    }
                });
                e.printStackTrace();
            } catch (JSONException e) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(getApplicationContext(),"Can't put Check User results into JSON Object",Toast.LENGTH_LONG).show();
                    }
                });
                e.printStackTrace();
            }
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {

            try {
                switch(resultJSON.getInt("code")){
                    case 0 :
                        showProgress(false);
                        message = resultJSON.getString("message");
                        Toast.makeText(getApplicationContext(),message,Toast.LENGTH_SHORT).show();
                        break;
                    case 1:
                        user.put("user_name",resultJSON.getString("new_user_name"));
                        user.put("user_password",resultJSON.getString("new_user_password"));
                        db_helper_user.setUserInfo(user);
                        showProgress(false);
                        finish();
                        Toast.makeText(getApplicationContext(),"Profile Updated",Toast.LENGTH_SHORT).show();
                        break;
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }

        }
    }



    //Method to get the results from the API into a String
    private static String getStringFromInputStream(InputStream is) {

        BufferedReader br = null;
        StringBuilder sb = new StringBuilder();

        String line;
        try {

            br = new BufferedReader(new InputStreamReader(is));
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }

        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (br != null) {
                try {
                    br.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

        return sb.toString();

    }


    /**
     * Shows the progress UI and hides the login form.
     */
    @TargetApi(Build.VERSION_CODES.HONEYCOMB_MR2)
    private void showProgress(final boolean show) {
        // On Honeycomb MR2 we have the ViewPropertyAnimator APIs, which allow
        // for very easy animations. If available, use these APIs to fade-in
        // the progress spinner.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB_MR2) {
            int shortAnimTime = getResources().getInteger(android.R.integer.config_shortAnimTime);

            mLoginFormView.setVisibility(show ? View.GONE : View.VISIBLE);
            mLoginFormView.animate().setDuration(shortAnimTime).alpha(
                    show ? 0 : 1).setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    mLoginFormView.setVisibility(show ? View.GONE : View.VISIBLE);
                }
            });

            mProgressView.setVisibility(show ? View.VISIBLE : View.GONE);
            mProgressView.animate().setDuration(shortAnimTime).alpha(
                    show ? 1 : 0).setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    mProgressView.setVisibility(show ? View.VISIBLE : View.GONE);
                }
            });
        } else {
            // The ViewPropertyAnimator APIs are not available, so simply show
            // and hide the relevant UI components.
            mProgressView.setVisibility(show ? View.VISIBLE : View.GONE);
            mLoginFormView.setVisibility(show ? View.GONE : View.VISIBLE);
        }
    }

}
