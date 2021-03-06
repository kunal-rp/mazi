package com.vierve;

import android.*;
import android.Manifest;
import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.provider.Settings;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;

import android.os.AsyncTask;

import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.JsonReader;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwt;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import java.security.Key;

import javax.crypto.spec.SecretKeySpec;


/**
 * A login screen that offers login via email/password.
 */


public class LoginActivity extends AppCompatActivity  {

    private SocketHandler socketHandler;

    //String url = "http://192.168.1.204:3000";
    String url = "http://server.vierve.com";

    // UI references.
    private EditText mUserNameView;
    private EditText mPasswordView;
    private CheckBox mRemember;

    //Progress Circle Objects
    private View mProgressView;
    private View mLoginFormView;

    //DB Stores User data
    private Db_Helper_User db_helper_user;

    //Activity vars
    private String user_name;
    private String user_password;

    //holds the permissions needed for the app to function
    String[] permissions = new String[]{android.Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION};
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        socketHandler = new SocketHandler();
        /*Sets the url to the parameter
        All future activities base their connections off of this url
         */
        socketHandler.setURL(url);



        //DB User Info handler
        db_helper_user = new Db_Helper_User(this,null);

        mUserNameView = (EditText) findViewById(R.id.user_name);
        mPasswordView = (EditText) findViewById(R.id.user_password);
        mRemember = (CheckBox) findViewById(R.id.remember);

        mLoginFormView = findViewById(R.id.login_form);
        mProgressView = findViewById(R.id.login_progress);

        showProgress(true);
        new GetCodes().execute();


        TextView forgot_username = (TextView) findViewById(R.id.forgot_username);
        forgot_username.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(getApplicationContext(), ForgotActivity.class);
                intent.putExtra("type_forget","username");
                startActivity(intent);
            }
        });

        TextView forgot_password = (TextView) findViewById(R.id.forgot_password);
        forgot_password.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(getApplicationContext(), ForgotActivity.class);
                intent.putExtra("type_forget","password");
                startActivity(intent);
            }
        });


        Button signInButton = (Button) findViewById(R.id.sign_in);
        signInButton.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View view) {
                user_name = mUserNameView.getText().toString();
                user_password = mPasswordView.getText().toString();
                attemptLogin();
            }
        });


        //Registration Activity
        Button registerButton = (Button) findViewById(R.id.register);
        registerButton.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(getApplicationContext(), RegisterActivity.class);
                startActivity(intent);
            }
        });
    }

    /**
     * Attempts to sign in or register the account specified by the login form.
     * If there are form errors (invalid email, missing fields, etc.), the
     * errors are presented and no actual login attempt is made.
     */
    private void attemptLogin() {

        // Reset errors.
        mUserNameView.setError(null);
        mPasswordView.setError(null);

        boolean cancel = false;
        View focusView = null;

        if (TextUtils.isEmpty(user_password)){
            mPasswordView.setError(getString(R.string.error_field_required));
            focusView = mPasswordView;
            cancel = true;
        }
        else if (!isPasswordValid(user_password)){
            mPasswordView.setError("Max Length is 30 characters");
            focusView = mPasswordView;
            cancel = true;
        }

        if (TextUtils.isEmpty(user_name)) {
            mUserNameView.setError(getString(R.string.error_field_required));
            focusView = mUserNameView;
            cancel = true;
        } else if (!isUsernameValid(user_name)) {
            mUserNameView.setError(getString(R.string.error_invalid_email));
            focusView = mUserNameView;
            cancel = true;
        }

        if (cancel) {
            focusView.requestFocus();

        } else {
            showProgress(true);
            new LoginActivity.CheckUser().execute();

        }
    }

    private boolean isUsernameValid(String username) {
        return !TextUtils.isEmpty(username) && username.length() <16;
    }



    private boolean isPasswordValid(String password) {
        return !TextUtils.isEmpty(password) ;
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

    private class GetCodes extends AsyncTask<Object, Object, Void> {

        JSONObject results;

        byte[] encodedKey = new String("vierve_device_KRP").getBytes();
        Key k = new SecretKeySpec(encodedKey, SignatureAlgorithm.HS256.getJcaName());
        @Override
        protected Void doInBackground(Object... args) {
            try {

                String token = Jwts.builder().claim("user_type","vierve_android").signWith(SignatureAlgorithm.HS256, k).compact();
                String urlstring = socketHandler.getURL() + "/getCodes"  ;
                MyLogger.d("KTag",urlstring);
                MyLogger.d("KTag", "Get Codes REST API check");
                URL versionUrl = new URL(urlstring);
                HttpURLConnection myConnection = (HttpURLConnection) versionUrl.openConnection();
                myConnection.setRequestProperty("token",token);
                if (myConnection.getResponseCode() == 200) {
                    InputStream responseBody = myConnection.getInputStream();
                    InputStreamReader responseBodyReader = new InputStreamReader(responseBody, "UTF-8");
                    JsonReader jsonReader = new JsonReader(responseBodyReader);
                    String var = getStringFromInputStream(responseBody);
                    MyLogger.d("KTag",var);
                    results = new JSONObject(var);
                    MyLogger.d("KTag", "Sucsessful http REST API");
                } else {
                    MyLogger.d("KTag", Integer.toString(myConnection.getResponseCode()));
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
            super.onPostExecute(aVoid);

            try {
                String token  =results.getString("token");
                Object claims =  Jwts.parser().setSigningKey(new String("vierve_device_KRP").getBytes()).parse(token).getBody();
                JSONObject obj = new JSONObject(claims.toString());
                socketHandler.setDefaultKey(obj.getString("vierve_android"));
                MyLogger.d("KTag","Default JWT Key:"+ socketHandler.getDefaultKey());
                showProgress(false);
                if(db_helper_user.getRemember() == true){
                    JSONObject user_data;
                    try {
                        user_data = db_helper_user.getInfo();
                        user_name = user_data.getString("user_name");
                        user_password = user_data.getString("user_password");
                        mUserNameView.setText(user_name);
                        mPasswordView.setText(user_password);
                        mRemember.setChecked(true);
                        attemptLogin();

                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                }



            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }

    /*
   Async task that calles REST API to first get the current data version number from db_helper_data
   Then passes that into the 'checkVersion' URL
    */
    private class CheckUser extends AsyncTask<Object, Object, Void> {


        JSONObject resultJSON;

        byte[] encodedKey = new String(socketHandler.getDefaultKey()).getBytes();
        Key k = new SecretKeySpec(encodedKey, SignatureAlgorithm.HS256.getJcaName());

        protected Void doInBackground(Object... args) {
            try {
                String token = Jwts.builder().claim("user_name",user_name).claim("user_password",user_password).signWith(SignatureAlgorithm.HS256, k).compact();

                String urlstring = socketHandler.getURL() + "/checkUser";
                MyLogger.d("KTag",urlstring);
                MyLogger.d("KTag", "Check User REST API check");
                URL versionUrl = new URL(urlstring);
                HttpURLConnection myConnection = (HttpURLConnection) versionUrl.openConnection();
                myConnection.setRequestProperty("user_type", "vierve_android");
                myConnection.setRequestProperty("token", token);
                if (myConnection.getResponseCode() == 200) {
                    InputStream responseBody = myConnection.getInputStream();
                    InputStreamReader responseBodyReader = new InputStreamReader(responseBody, "UTF-8");
                    JsonReader jsonReader = new JsonReader(responseBodyReader);
                    String var = getStringFromInputStream(responseBody);
                    MyLogger.d("KTag",var);
                    resultJSON = new JSONObject(var);
                    MyLogger.d("KTag", "Sucsessful http REST API");
                    MyLogger.d("KTag", "JSON Response Object : " +resultJSON.toString());
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            new LoginActivity.PushNewData().execute(resultJSON);
                        }
                    });

                } else {
                    MyLogger.d("KTag", Integer.toString(myConnection.getResponseCode()));
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

    /*
    Async Task
    Uses the results from the REST API to determine whether to update the local db with the correct information or to move along
     */
    private class PushNewData extends AsyncTask<Object, Object, Void> {

        int code;
        String message;
        JSONObject resultJSON;

        @Override
        protected Void doInBackground(Object... args) {
            resultJSON = (JSONObject) args[0];
            try {
                code = resultJSON.getInt("code");

            } catch (JSONException e) {
                Toast.makeText(getApplicationContext(), "No Results from Check User", Toast.LENGTH_LONG).show();
                e.printStackTrace();
            }
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            showProgress(false);

            if (code == 1) {

                db_helper_user.clearAllTables();
                //valid username or password

                JSONObject obj = new JSONObject();
                try {
                    socketHandler.setUserKey(resultJSON.getString("auth_code"));
                    MyLogger.d("KTag","User Key Set:"+socketHandler.getUserKey());
                    obj.put("user_id", resultJSON.getString("user_id"));
                    obj.put("user_name", user_name);
                    obj.put("user_password", user_password);
                    obj.put("user_email", resultJSON.getString("user_email"));
                    obj.put("remember", (mRemember.isChecked()) ? 1 : 0);
                    db_helper_user.setUserInfo(obj);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                if (mRemember.isChecked() == true) {
                    db_helper_user.setRemember(true);
                } else {
                    db_helper_user.setRemember(false);
                }

                if (askPermissions() == true && isLocationEnabled(getApplicationContext()) == true) {
                    Intent intent = new Intent(getApplicationContext(), MainActivity.class);
                    startActivity(intent);
                } else {
                    Toast.makeText(getApplicationContext(), "Need GPS Permiccion Access and Location Service Enabled to Continue", Toast.LENGTH_LONG).show();
                }
            } else if (code == 0) {
                try {
                    message = resultJSON.getString("message");
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(getApplicationContext(), message, Toast.LENGTH_LONG).show();
                        }
                    });
                } catch (JSONException e) {
                    e.printStackTrace();
                }

            }
        }
    }


    /*
   Returns true if all permissions have been granted
   Returns false if permissions missing, and then requests the permission
    */
    public boolean askPermissions(){
        for (int i = 0; i < permissions.length; i++) {
            String permission = permissions[i];
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{permission}, 123);
                return false;
            }
        }
        return true;
    }

    public static boolean isLocationEnabled(Context context) {
        int locationMode = 0;
        String locationProviders;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT){
            try {
                locationMode = Settings.Secure.getInt(context.getContentResolver(), Settings.Secure.LOCATION_MODE);

            } catch (Settings.SettingNotFoundException e) {
                e.printStackTrace();
                return false;
            }

            return locationMode != Settings.Secure.LOCATION_MODE_OFF;

        }else{
            locationProviders = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.LOCATION_PROVIDERS_ALLOWED);
            return !TextUtils.isEmpty(locationProviders);
        }


    }


}

