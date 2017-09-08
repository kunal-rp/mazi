package com.vierve;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.app.LoaderManager.LoaderCallbacks;

import android.content.CursorLoader;
import android.content.Loader;
import android.database.Cursor;
import android.net.Uri;
import android.os.AsyncTask;

import android.os.Build;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.support.v7.widget.Toolbar;
import android.text.TextUtils;
import android.util.JsonReader;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.inputmethod.EditorInfo;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

/**
 * A login screen that offers login via email/password.
 */
public class LoginActivity extends AppCompatActivity  {

    private Intent intent;

    String krpURL = "http://192.168.5.135:3000";

    // UI references.
    private EditText mUserNameView;
    private EditText mPasswordView;


    private View mProgressView;
    private View mLoginFormView;
    private CheckBox mRemember;

    private Db_Helper_User db_helper_user;

    private String user_name;
    private String user_password;

    private boolean remember;

    private JSONObject resultJSON;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        intent = new Intent(this, MainActivity.class);

        db_helper_user = new Db_Helper_User(this,null);

        mUserNameView = (EditText) findViewById(R.id.user_name);
        mPasswordView = (EditText) findViewById(R.id.user_password);
        mRemember = (CheckBox) findViewById(R.id.remember);


        mLoginFormView = findViewById(R.id.login_form);
        mProgressView = findViewById(R.id.login_progress);



        if(db_helper_user.getRemember() == true){
            Log.d("KTag","Pre Set Test");
            JSONObject obj;
            try {
                Log.d("KTag","Pre set details");
                obj = db_helper_user.getInfo();
                showProgress(true);
                user_name = obj.getString("user_name");
                user_password = obj.getString("user_password");
                remember = true;
                mUserNameView.setText(user_name);
                mPasswordView.setText(user_password);
                mRemember.setEnabled(true);
                Log.d("KTag","Details Username : "+ user_name + ", Password :" +user_password);
                attemptLogin();

            } catch (JSONException e) {
                e.printStackTrace();
            }

        }

        Button signInButton = (Button) findViewById(R.id.sign_in);
        signInButton.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View view) {
                user_name = mUserNameView.getText().toString();
                user_password = mPasswordView.getText().toString();
                if(mRemember.isEnabled()){
                    remember = true;
                }
                else{
                    remember = false;
                }
                Log.d("KTag","Details Username : "+ user_name + ", Password :" +user_password);
                attemptLogin();
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
        return username.length() <16;
    }

    private boolean isPasswordValid(String password) {
        return password.length() < 31 ;
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

    /*
   Async task that calles REST API to first get the current data version number from db_helper_data
   Then passes that into the 'checkVersion' URL
    */
    private class CheckUser extends AsyncTask<Object, Object, Void> {
        @Override
        protected Void doInBackground(Object... args) {
            try {
                //REST API url ; calls db method to get the largest verison
                String urlstring = krpURL + "/checkUser?user_name=" + user_name + "&user_password="+user_password;
                Log.d("KTag",urlstring);
                Log.d("KTag", "Check User REST API check");
                URL versionUrl = new URL(urlstring);
                HttpURLConnection myConnection = (HttpURLConnection) versionUrl.openConnection();
                myConnection.setRequestProperty("User-Agent", "android-client");
                if (myConnection.getResponseCode() == 200) {
                    InputStream responseBody = myConnection.getInputStream();
                    InputStreamReader responseBodyReader = new InputStreamReader(responseBody, "UTF-8");
                    JsonReader jsonReader = new JsonReader(responseBodyReader);
                    String var = getStringFromInputStream(responseBody);
                    resultJSON = new JSONObject(var);
                    Log.d("KTag", "Sucsessful http REST API");

                } else {
                    Log.d("KTag", "Error");
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

            new LoginActivity.PushNewData().execute();
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

        @Override
        protected Void doInBackground(Object... params) {

            try {
                code = resultJSON.getInt("code");

            } catch (JSONException e) {
                Toast.makeText(getApplicationContext(),"No Results from Check User",Toast.LENGTH_LONG).show();
                e.printStackTrace();
            }
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            showProgress(false);

            if (code == 3) {
                db_helper_user.clearAllTables();
                //valid username or password

                JSONObject obj = new JSONObject();
                try {
                    obj.put("user_id", resultJSON.getString("user_id"));
                    obj.put("user_name", user_name);
                    obj.put("user_password", user_password);
                    obj.put("remember", (mRemember.isEnabled())?1:0);
                    db_helper_user.setUserInfo(obj);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                if (mRemember.isChecked() == true) {
                    db_helper_user.setRemember(true);
                }
                else{
                    db_helper_user.setRemember(false);
                }
                startActivity(intent);
            } else if (code == 1) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(getApplicationContext(), "Invalid Username or Password", Toast.LENGTH_LONG).show();
                    }
                });
            } else if(code == 2) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(getApplicationContext(), "User active on different device", Toast.LENGTH_LONG).show();
                    }
                });
            }
            else if(code == 4){
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(getApplicationContext(), "Need to verify email to continue.\nCheck email", Toast.LENGTH_LONG).show();
                    }
                });
            }
        }
    }


}

