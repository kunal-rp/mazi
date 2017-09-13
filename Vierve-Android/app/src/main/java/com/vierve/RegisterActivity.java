package com.vierve;

import android.os.AsyncTask;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {

        setContentView(R.layout.activity_register);
        socketHandler = new SocketHandler();


        userName_view = (EditText) findViewById(R.id.username_view);
        email_view = (EditText) findViewById(R.id.email_view);
        password_view  = (EditText) findViewById(R.id.password_view);
        confirm_password_view = (EditText) findViewById(R.id.confirm_password_view);


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
        @Override
        protected Void doInBackground(Object... args) {
            try {
                //REST API url ; calls db method to get the largest verison
                String urlstring = socketHandler.getURL() + "/checkUsername?user_name=" + user_name ;
                Log.d("KTag",urlstring);
                Log.d("KTag", "Check Username REST API check");
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

        @Override
        protected Void doInBackground(Object... params) {

            try {
                //REST API url ; calls db method to get the largest verison
                String urlstring = socketHandler.getURL() + "/createUser?user_name=" + user_name +"&user_password="+password + "&user_email="+email;
                Log.d("KTag",urlstring);
                Log.d("KTag", "Create User REST API check");
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
}
