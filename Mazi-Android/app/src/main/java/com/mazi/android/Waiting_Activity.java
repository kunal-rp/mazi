package com.mazi.android;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;
import com.google.android.gms.vision.text.Text;

import org.json.JSONException;
import org.json.JSONObject;

import java.net.URISyntaxException;

public class Waiting_Activity extends AppCompatActivity {

    //var for the socket
    private Socket mSocket;

    //values retrieved from the previous activities
    private String type;
    private String selected_college_id, selected_parkinglot_id;

    //temp textview for the activity
    private TextView textView;

    //views used form the spinner NEED TO WORK ON
    private View mProgressView;
    private View mLoginFormView;

    String krpURL = "http://192.168.1.204:3000";

    //connects to the server
    {
        try{
            mSocket = IO.socket(krpURL);
        } catch (URISyntaxException e) {
            Log.i("Socket", "Invalid URI");
            Toast.makeText(this, "No Connection", Toast.LENGTH_SHORT).show();
        }
        //need to handle exception where connection not made
    }


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_waiting_);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        textView = (TextView) findViewById(R.id.tex);

        mLoginFormView = findViewById(R.id.login_form);
        mProgressView = findViewById(R.id.login_progress);

        Intent intent = getIntent();
        Bundle bundle = intent.getExtras();
        selected_college_id = bundle.getString("selected_college_id");
        selected_parkinglot_id = bundle.getString("selected_parkinglot_id");
        type = bundle.getString("type");

        /*activity will first call set user to push the user id and name when it ilitially establishes the connection,
        and then will emit a register event to register the request for a park/ride.Currently, the set user data is just static,
         but we want to set those values in a local db during the login activity.
        */
        //socket event when the phone recieves the 'confirm set User event'
        mSocket.on("confirm_setUser",new Emitter.Listener() {

            @Override
            public void call(final Object... args) {
                Log.d("KTag","Set USer Confirmed");
                JSONObject obj = new JSONObject();
                JSONObject temp= (JSONObject) args[0];
                try {
                    JSONObject user = (JSONObject) temp.get("user");
                    obj.put("user",user);
                    obj.put("college_id", selected_college_id);
                    obj.put("parkinglot_id",selected_parkinglot_id);
                    obj.put("time",0);
                    obj.put("type",type);
                    mSocket.emit("register",obj);
                    Log.d("KTag","Register Event");
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        });

        //will automatically call async task to establish connection with server
        new Waiting_Activity.EstablishWebSocket().execute();

    }



    @Override
    protected void onDestroy() {
        //will first get rid of all listeners for events
        mSocket.off();
        //will then disconnect from server
        mSocket.disconnect();
        super.onDestroy();
    }

    //just calls connect
    private class EstablishWebSocket extends AsyncTask<JSONObject, Void, Void>{

        @Override
        protected Void doInBackground(JSONObject... params) {
            mSocket.connect();
            showProgress(true);
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            new Waiting_Activity.SetUser().execute();
        }
    }

    /*
    async called to emit the setUSer event to the server
    server needs this info to identify the user with a socket connection
    */
    private class SetUser extends AsyncTask<JSONObject, Void, Void>{

        JSONObject user = new JSONObject();
        @Override
        protected Void doInBackground(JSONObject... params) {

            Log.d("KTag","Set User Event Called");

            try {
                //Static random values for the user id and name
                user.put("user_id", "bbbbbb");
                user.put("user_name","KunalMobile");

                mSocket.emit("setUser",user);
            } catch (JSONException e) {
                e.printStackTrace();
            }
            return null;
        }
    }

    /**
     * Shows the progress UI and hides the login form.
     * Copied from the login activiy
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
