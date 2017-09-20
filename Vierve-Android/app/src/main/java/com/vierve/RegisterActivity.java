package com.vierve;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.JsonReader;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
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
import java.security.Key;

import javax.crypto.spec.SecretKeySpec;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

/**
 * Created by kunal on 9/10/17.
 */

public class RegisterActivity extends AppCompatActivity {

    private SocketHandler socketHandler;

    JSONObject resultJSON = new JSONObject();
    String user_name;
    String email;
    String password;
    String confirm_password;
    Boolean validEmail;

    EditText userName_view;
    EditText email_view;
    EditText password_view;
    EditText confirm_password_view;

    View mainForm;
    View progressForm;

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        setContentView(R.layout.activity_register);
        socketHandler = new SocketHandler();


        userName_view = (EditText) findViewById(R.id.username_view);
        email_view = (EditText) findViewById(R.id.email_view);
        password_view  = (EditText) findViewById(R.id.password_view);
        confirm_password_view = (EditText) findViewById(R.id.confirm_password_view);


        mainForm = findViewById(R.id.main_view);
        progressForm = findViewById(R.id.progress_view);

        super.onCreate(savedInstanceState);

        Button btn = (Button) findViewById(R.id.register_btn);
        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                user_name =  userName_view.getText().toString();
                email =  email_view.getText().toString();
                password = password_view.getText().toString();
                confirm_password =  confirm_password_view.getText().toString();
                runCheckUsername();
            }
        });
    }


    public static boolean isValidEmail(String target) {
        Log.d("KTag", String.valueOf(target.length()));
        Log.d("KTag", String.valueOf(android.util.Patterns.EMAIL_ADDRESS.matcher(target).matches()));
        return target.length() != 0 && android.util.Patterns.EMAIL_ADDRESS.matcher(target).matches();
    }

    public static boolean isvalidUsername(String username) {
        Log.d("KTag","Username length : "+username.length());
        Log.d("KTag","Username "+username);
        for(int i =0 ; i < username.length(); i++){
            if(!Character.isLetter(username.charAt(i)) && !Character.isDigit(username.charAt(i)) && username.charAt(i) != '.' && username.charAt(i) != '_'){
                Log.d("KTag","Punc @ "+i);
                return false;
            }
        }

        return username.length() > 2 && username.length() <16;
    }

    public static boolean isValidPasswordMatch(String password1, String password2) {
        return password1.equals(password2);
    }

    public static boolean isValidPassword(String password1) {
        return password1.length() > 0 ;
    }

    public void runCheckUsername(){
        userName_view.setError(null);
        email_view.setError(null);
        confirm_password_view.setError(null);
        password_view.setError(null);
        if(isValidEmail(email) && isvalidUsername(user_name)&& isValidPasswordMatch(password,confirm_password)){

            Log.d("KTag","All valid credentials");
            new RegisterActivity.CheckUsername().execute();
        }
        else{
            if(!isvalidUsername(user_name)){
                Log.d("KTag","Invalid Username");
                userName_view.setError("Invalid Username");
                userName_view.requestFocus();
            }
            else if(!isValidEmail(email)){
                Log.d("KTag","Invalid Email");
                email_view.setError("Invalid Email");
                email_view.requestFocus();
            }
            else if(isValidPassword(password)){
                Log.d("KTag","Invalid Password");
                password_view.setError("Invalid Password ");
                password_view.requestFocus();
            }
            else if(!isValidPasswordMatch(password,confirm_password)){
                Log.d("KTag","Passwords don't match");
                confirm_password_view.setError("Passwords don't match");
                confirm_password_view.requestFocus();
            }
        }
    }

    /*
       Async task that calles REST API to first get the current data version number from db_helper_data
       Then passes that into the 'checkVersion' URL
        */
    private class CheckUsername extends AsyncTask<Object, Object, Void> {


        String message;

        byte[] encodeData = new String(socketHandler.getDefaultKey()).getBytes();
        Key key_data = new SecretKeySpec(encodeData, SignatureAlgorithm.HS256.getJcaName());

        @Override
        protected Void doInBackground(Object... args) {
            try {
                String token_data = Jwts.builder().claim("user_name",user_name).signWith(SignatureAlgorithm.HS256, key_data).compact();
                //REST API url ; calls db method to get the largest verison
                String urlstring = socketHandler.getURL() + "/checkUsername" ;
                Log.d("KTag",urlstring);
                Log.d("KTag", "Check Username REST API check");
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


                try {
                    switch(resultJSON.getInt("code")){
                        case 0 :
                            message = resultJSON.getString("message");
                            Toast.makeText(getApplicationContext(),message,Toast.LENGTH_SHORT).show();
                            break;
                        case 1:
                            new RegisterActivity.CreateUser().execute();
                            break;
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }

        }
    }



    /*
    Async Task
    Uses the results from the REST API to determine whether to update the local db with the correct information or to move along
     */
    private class CreateUser extends AsyncTask<Object, Object, Void> {

        int code;
        String message;

        byte[] encodeData = new String(socketHandler.getDefaultKey()).getBytes();
        Key key_data = new SecretKeySpec(encodeData, SignatureAlgorithm.HS256.getJcaName());


        @Override
        protected Void doInBackground(Object... params) {

            try {
                String token_data = Jwts.builder().claim("user_name",user_name).claim("user_password",password).claim("user_email",email).signWith(SignatureAlgorithm.HS256, key_data).compact();
                //REST API url ; calls db method to get the largest verison
                String urlstring = socketHandler.getURL() + "/createUser";
                Log.d("KTag",urlstring);
                Log.d("KTag", "Create User REST API check");
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
            super.onPostExecute(aVoid);
            try {
                switch(resultJSON.getInt("code")){
                    case 0:
                        message = resultJSON.getString("message");
                        Toast.makeText(getApplicationContext(),message,Toast.LENGTH_SHORT).show();
                        break;
                    case 1:
                        Toast.makeText(getApplicationContext(),"Registered.\n Verify given Email",Toast.LENGTH_SHORT).show();
                        finish();
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

            mainForm.setVisibility(show ? View.GONE : View.VISIBLE);
            mainForm.animate().setDuration(shortAnimTime).alpha(
                    show ? 0 : 1).setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    mainForm.setVisibility(show ? View.GONE : View.VISIBLE);
                }
            });

            progressForm.setVisibility(show ? View.VISIBLE : View.GONE);
            progressForm.animate().setDuration(shortAnimTime).alpha(
                    show ? 1 : 0).setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    progressForm.setVisibility(show ? View.VISIBLE : View.GONE);
                }
            });
        } else {
            // The ViewPropertyAnimator APIs are not available, so simply show
            // and hide the relevant UI components.
            progressForm.setVisibility(show ? View.VISIBLE : View.GONE);
            mainForm.setVisibility(show ? View.GONE : View.VISIBLE);
        }
    }


}
