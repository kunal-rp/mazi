package com.vierve;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.util.JsonReader;
import android.util.Log;
import android.view.View;
import android.widget.Button;
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
import java.security.Key;

import javax.crypto.spec.SecretKeySpec;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

/**
 * Created by kunal on 9/14/17.
 */

public class ForgotActivity extends AppCompatActivity {



    private SocketHandler socketHandler;
    private String type_forget;
    EditText email_view;


    //Progress Circle Objects
    private View mProgressView;
    private View mMainView;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forgot);

        socketHandler = new SocketHandler();

        mMainView = findViewById(R.id.main_view);
        mProgressView = findViewById(R.id.progress_view);

        Bundle bundle = getIntent().getExtras();
        type_forget = bundle.getString("type_forget");
        email_view = (EditText) findViewById(R.id.email_view);

        TextView title = (TextView) findViewById(R.id.title_profile);
        if(type_forget.equals("password")){
            title.setText("Reset Your Password");
        }
        else if(type_forget.equals("username")){
            title.setText("Forgot Your Username");
        }
        Button btn = (Button) findViewById(R.id.reset_credential);
        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                runReset();
            }
        });


    }

    public static boolean isValidEmail(String target) {
        return target.length() != 0 && android.util.Patterns.EMAIL_ADDRESS.matcher(target).matches();
    }

    public void runReset(){
        if(isValidEmail(email_view.getText().toString())){
            showProgress(true);
            new ResetCredential().execute(email_view.getText().toString(),type_forget);
        }
        else{
            MyLogger.d("KTag","Invalid Email");
            email_view.setError("Invalid Email");
            email_view.requestFocus();
        }
    }

    /*
       Async task that calles REST API to first get the current data version number from db_helper_data
       Then passes that into the 'checkVersion' URL
        */
    private class ResetCredential extends AsyncTask<Object, Object, Void> {


        String message;
        JSONObject resultJSON;

        byte[] encodedKey = new String(socketHandler.getDefaultKey()).getBytes();
        Key k = new SecretKeySpec(encodedKey, SignatureAlgorithm.HS256.getJcaName());

        @Override
        protected Void doInBackground(Object... args) {
            try {
                //REST API url ; calls db method to get the largest verison
                String token = Jwts.builder().claim("user_email",args[0]).claim("type_forget",args[1]).signWith(SignatureAlgorithm.HS256, k).compact();

                String urlstring = socketHandler.getURL() + "/resetCredential" ;
                MyLogger.d("KTag",urlstring);
                MyLogger.d("KTag", "Check Username REST API check");
                URL versionUrl = new URL(urlstring);
                HttpURLConnection myConnection = (HttpURLConnection) versionUrl.openConnection();
                myConnection.setRequestProperty("user_type", "vierve_android");
                myConnection.setRequestProperty("token", token);
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

            showProgress(false);
            try {
                switch(resultJSON.getInt("code")){
                    case 0 :
                        message = resultJSON.getString("message");
                        Toast.makeText(getApplicationContext(),message,Toast.LENGTH_SHORT).show();
                        break;
                    case 1:
                        Toast.makeText(getApplicationContext(),(type_forget.equals("username")?"Your username was sent to your email":"Your email was reset.\nCheck Your email"),Toast.LENGTH_LONG).show();
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

            mMainView.setVisibility(show ? View.GONE : View.VISIBLE);
            mMainView.animate().setDuration(shortAnimTime).alpha(
                    show ? 0 : 1).setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    mMainView.setVisibility(show ? View.GONE : View.VISIBLE);
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
            mMainView.setVisibility(show ? View.GONE : View.VISIBLE);
        }
    }

}
