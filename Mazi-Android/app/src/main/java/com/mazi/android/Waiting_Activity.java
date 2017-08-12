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
import java.util.Random;

public class Waiting_Activity extends AppCompatActivity {

    //var for the socket
    private Socket mSocket;
    SocketHandler socketHandler;

    //values retrieved from the previous activities
    private String type;
    private String selected_college_id, selected_parkinglot_id;

    //temp textview for the activity
    private TextView textView;

    private JSONObject user;


    String krpURL = "http://192.168.1.204:3000";
    boolean submitRequest;



    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_waiting_);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        textView = (TextView) findViewById(R.id.tex);
        textView.setText("Initail");


        socketHandler = new SocketHandler();

        Intent intent = getIntent();
        Bundle bundle = intent.getExtras();
        submitRequest = bundle.getBoolean("submitRequest");
        selected_college_id = bundle.getString("selected_college_id");
        selected_parkinglot_id = bundle.getString("selected_parkinglot_id");
        type = bundle.getString("type");
        try {
            user = new JSONObject(bundle.getString("user"));
        } catch (JSONException e) {
            e.printStackTrace();
        }
        textView.setText("Request made : "+ type + " | "+ "college_id" + " | "+ selected_college_id+ "parkinglot_id" + " | "+ selected_parkinglot_id);


        mSocket = socketHandler.getSocket();



        if(submitRequest){
            JSONObject obj = new JSONObject();
            try {
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



        mSocket.on("matched_confirm", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                matchMade();
            }
        });
    }


    public void matchMade(){
        Intent intent = new Intent(this, RealtimeMapActivity.class);
        startActivity(intent);
    }



    @Override
    protected void onDestroy() {
        //JSONObject t = new JSONObject();
        //mSocket.emit("cancelRequest",t);
        super.onDestroy();
    }

    public void cancelRequest(View view){
        JSONObject t = new JSONObject();
        mSocket.emit("cancelRequest",t);
        finish();
    }


}
