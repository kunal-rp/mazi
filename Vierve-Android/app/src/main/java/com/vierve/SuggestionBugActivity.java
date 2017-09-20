package com.vierve;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.PersistableBundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.util.JsonReader;
import android.util.Log;
import android.view.Menu;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.security.Key;

import javax.crypto.spec.SecretKeySpec;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

/**
 * Created by kunal on 9/15/17.
 */

public class SuggestionBugActivity extends AppCompatActivity {

    //Progress Circle Objects
    private View mProgressView;
    private View mMainView;

    private SocketHandler socketHandler;

    private Db_Helper_User db_helper_user;



    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.d("KTag","SuggestionActivity");
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_suggest_report);

        socketHandler = new SocketHandler();
        db_helper_user = new Db_Helper_User(this,null);

        mProgressView = findViewById(R.id.progress_view);
        mMainView = findViewById(R.id.main_view);

        final Spinner spinner = (Spinner) findViewById(R.id.spinner_type);
        ArrayAdapter<String> spinnerArrayAdapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_item, new String[]{"Suggestion ","Report a Bug"}); //selected item will look like a spinner set from XML
        spinnerArrayAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(spinnerArrayAdapter);

        final EditText comment = (EditText) findViewById(R.id.comment);

        Button btn = (Button) findViewById(R.id.btn_submit);
        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String type = spinner.getSelectedItem().toString();
                String data = "SERIAL: " + Build.SERIAL + "|" +
                                "MODEL: " + Build.MODEL + "|" +
                                "ID: " + Build.ID + "|" +
                                "Manufacture: " + Build.MANUFACTURER + "|" +
                                "Brand: " + Build.BRAND + "|" +
                                "Type: " + Build.TYPE + "|" +
                                "User: " + Build.USER + "|" +
                                "BASE: " + Build.VERSION_CODES.BASE + "|" +
                                "INCREMENTAL: " + Build.VERSION.INCREMENTAL + "|" +
                                "SDK:  " + Build.VERSION.SDK + "|" +
                                "BOARD: " + Build.BOARD + "|" +
                                "BRAND: " + Build.BRAND + "|" +
                                "HOST: " + Build.HOST + "|" +
                                "FINGERPRINT: "+Build.FINGERPRINT + "|" +
                                "Version Code: " + Build.VERSION.RELEASE;
                String comment_text = comment.getText().toString();
                String user_id = null;
                try {
                    user_id = URLEncoder.encode(db_helper_user.getInfo().getString("user_id"),"UTF-8");
                } catch (UnsupportedEncodingException e) {
                    e.printStackTrace();
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                showProgress(true);
                new SubmitSuggestion().execute(user_id,type,data,comment_text);
            }
        });
    }


    /*
       Async task that calles REST API to first get the current data version number from db_helper_data
       Then passes that into the 'checkVersion' URL
        */
    private class SubmitSuggestion extends AsyncTask<Object, Object, Void> {


        String message;
        JSONObject resultJSON;

        byte[] encodeUserID = new String(socketHandler.getDefaultKey()).getBytes();
        byte[] encodeData = new String(socketHandler.getUserKey()).getBytes();
        Key key_userid = new SecretKeySpec(encodeUserID, SignatureAlgorithm.HS256.getJcaName());
        Key key_data = new SecretKeySpec(encodeData, SignatureAlgorithm.HS256.getJcaName());

        @Override
        protected Void doInBackground(Object... args) {
            try {

                String token_user = Jwts.builder().claim("user_id",args[0]).signWith(SignatureAlgorithm.HS256, key_userid).compact();
                String token_data = Jwts.builder().claim("user_id",args[0]).claim("type",args[1]).claim("system_data",args[2]).claim("comment",args[3]).signWith(SignatureAlgorithm.HS256, key_data).compact();


                String urlstring = socketHandler.getURL() + "/addSuggestion";
                Log.d("KTag",urlstring);
                Log.d("KTag", "Check Username REST API check");
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

            showProgress(false);
            try {
                switch(resultJSON.getInt("code")){
                    case 0 :
                        message = resultJSON.getString("message");
                        Toast.makeText(getApplicationContext(),message,Toast.LENGTH_SHORT).show();
                        break;
                    case 1:
                        Toast.makeText(getApplicationContext(),"Your suggestions/bug report was sent",Toast.LENGTH_LONG).show();
                        finish();
                        break;
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }

        }
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
