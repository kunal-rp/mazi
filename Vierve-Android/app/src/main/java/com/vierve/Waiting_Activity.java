package com.vierve;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.Socket;

import org.json.JSONException;
import org.json.JSONObject;

public class Waiting_Activity extends AppCompatActivity {

    //var for the socket
    private Socket mSocket;
    private SocketHandler socketHandler;

    //values retrieved from the previous activities
    private String type;
    private String selected_college_id, selected_parkinglot_id;
    double pu_lat,pu_lng;

    private DB_Helper_Data db_helper_data;




    boolean submitRequest;



    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_waiting_);



        db_helper_data = new DB_Helper_Data(this,null);


        socketHandler = new SocketHandler();

        Intent intent = getIntent();
        Bundle bundle = intent.getExtras();
        submitRequest = bundle.getBoolean("submitRequest");
        selected_college_id = bundle.getString("selected_college_id");
        selected_parkinglot_id = bundle.getString("selected_parkinglot_id");
        type = bundle.getString("type");

        TextView cText = (TextView) findViewById(R.id.college_name);
        cText.setText(db_helper_data.getCollegeName(Integer.parseInt(selected_college_id)));
        TextView pText = (TextView) findViewById(R.id.parkinglot_name);
        pText.setText(db_helper_data.getParkinglotName(Integer.parseInt(selected_parkinglot_id)));

        TextView typeTextview = (TextView) findViewById(R.id.request_type);
        if(type.equals("ride")){
            typeTextview.setText("Ride");
        }
        else{
            typeTextview.setText("Parking Spot");
        }

        mSocket = socketHandler.getSocket();

        mSocket.off("matched_confirm");

        mSocket.on("matched_confirm", new Emitter.Listener() {
            @Override
            public void call(Object... args) {

                JSONObject obj = (JSONObject)args[0];
                try {
                    matchMade(obj);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        });
    }


    public void matchMade(JSONObject obj) throws JSONException {
        Intent intent = new Intent(this, MatchActivity.class);
        Log.d("KTag","Match : "+ obj.toString());
        intent.putExtra("pu_lat",obj.getDouble("pu_lat"));
        intent.putExtra("pu_lng", obj.getDouble("pu_lng"));
        intent.putExtra("rider_user_id", (String) obj.getString("rider_user_id"));
        intent.putExtra("rider_user_name", (String) obj.getString("rider_user_name"));
        intent.putExtra("parker_user_id", (String) obj.getString("parker_user_id"));
        intent.putExtra("parker_user_name", (String) obj.getString("parker_user_name"));
        intent.putExtra("start_timestamp", (Integer) obj.getInt("start_timestamp"));
        startActivity(intent);
    }



    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    public void cancelRequest(View view){
        JSONObject t = new JSONObject();
        mSocket.emit("cancelRequest",t);
        finish();
    }

    @Override
    public void onBackPressed() {
        Toast.makeText(this, "Press Cancel to return to main screen",Toast.LENGTH_LONG).show();
    }
}
