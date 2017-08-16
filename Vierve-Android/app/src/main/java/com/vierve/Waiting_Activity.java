package com.vierve;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.Socket;

import org.json.JSONException;
import org.json.JSONObject;

public class Waiting_Activity extends AppCompatActivity {

    //var for the socket
    private Socket mSocket;
    SocketHandler socketHandler;

    //values retrieved from the previous activities
    private String type;
    private String selected_college_id, selected_parkinglot_id;
    double pu_lat,pu_lng;



    private JSONObject user;


    String krpURL = "http://192.168.1.204:3000";
    boolean submitRequest;



    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_waiting_);




        socketHandler = new SocketHandler();

        Intent intent = getIntent();
        Bundle bundle = intent.getExtras();
        submitRequest = bundle.getBoolean("submitRequest");
        selected_college_id = bundle.getString("selected_college_id");
        selected_parkinglot_id = bundle.getString("selected_parkinglot_id");
        type = bundle.getString("type");
        if(type.equals("ride")){
            pu_lat = bundle.getDouble("pickup_lat");
            pu_lng = bundle.getDouble("pickup_lng");
        }
        try {
            user = new JSONObject(bundle.getString("user"));
        } catch (JSONException e) {
            e.printStackTrace();
        }


        mSocket = socketHandler.getSocket();



        if(submitRequest){
            JSONObject obj = new JSONObject();
            try {
                obj.put("user",user);
                obj.put("college_id", selected_college_id);
                obj.put("parkinglot_id",selected_parkinglot_id);
                obj.put("time",0);
                obj.put("type",type);
                if(type.equals("ride")){
                    obj.put("pickup_lat",pu_lat);
                    obj.put("pickup_lng",pu_lng);
                }
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
        mSocket.off("matched_confirm");
        Intent intent = new Intent(this, MatchActivity.class);
        startActivity(intent);
    }



    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    public void cancelRequest(View view){
        JSONObject t = new JSONObject();
        mSocket.emit("cancelRequest",t);
        mSocket.off("matched_confirm");
        finish();
    }


}
