package com.vierve;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.util.AttributeSet;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.RatingBar;
import android.widget.TextView;
import android.widget.Toast;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.Socket;

import org.json.JSONException;
import org.json.JSONObject;
import org.w3c.dom.Text;

/**
 * Created by kunal on 8/28/17.
 */

public class RatingActivity extends AppCompatActivity {

    //var for the socket
    private Socket mSocket;
    private SocketHandler socketHandler;

    RatingBar ratingBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_rating);

        Log.d("KTag","RatingActivity started");

        socketHandler = new SocketHandler();
        mSocket = socketHandler.getSocket();


        ratingBar = (RatingBar) findViewById(R.id.ratingBar);
        Button btn = (Button) findViewById(R.id.submit);

        Intent intent = getIntent();
        Bundle bundle = intent.getExtras();
        final String user_id = bundle.getString("user_id");
        String rider_user_id = bundle.getString("rider_user_id");
        String rider_user_name = bundle.getString("rider_user_name");
        String parker_user_id = bundle.getString("parker_user_id");
        String parker_user_name = bundle.getString("parker_user_name");
        String match_end_type = bundle.getString("match_end_type");
        TextView overview = (TextView) findViewById(R.id.overview);
        overview.setText("@"+parker_user_name +" picked up @"+ rider_user_name);
        TextView match_type = (TextView) findViewById(R.id.match_type);
        match_type.setTextColor(getResources().getColor(android.R.color.white));
        if(match_end_type.equals("0")){
            match_type.setText("A Fair Pickup Occured");
            ratingBar.setRating(Float.valueOf("4.5"));
            match_type.setBackgroundColor(getResources().getColor(R.color.colorAccent));

        }
        else{
           String[] array = match_end_type.split("\\|");
            if(array[1] == rider_user_id){
                match_type.setText("@"+rider_user_name+" disconnected");
            }
            else{
                match_type.setText("@"+parker_user_name+" disconnected");
            }
            match_type.setBackgroundColor(getResources().getColor(R.color.error_red));

            ratingBar.setRating(Float.valueOf("3.0"));
        }
        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                JSONObject obj = new JSONObject();
                try {
                    obj.put("user_id", user_id);
                    obj.put("rating", ratingBar.getRating());
                    mSocket.emit("finish", obj);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                finish();
            }

        });



    }




}
