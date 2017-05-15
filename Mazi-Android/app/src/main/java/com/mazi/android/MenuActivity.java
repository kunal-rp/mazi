package com.mazi.android;

import android.content.Intent;
import android.os.AsyncTask;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.Toast;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.net.URISyntaxException;
import java.util.ArrayList;

public class MenuActivity extends AppCompatActivity {
    private JSONObject initial_data_from_server;

    private DB_Helper db_helper;


    String bpURL = "http://192.168.0.16:3000";
    String krpURL = "http://192.168.1.204:3000";

    private Spinner mCollegeSpinner;
    private Spinner mParkingSpinner;

    private ArrayList<String> hidden_college;
    private ArrayList<ArrayList<String>> hidden_parkinglots;

    //arrays for spinner info
    public ArrayList<String> face_college = new ArrayList<>();
    public ArrayList<String> face_parkinglots = new ArrayList<>();

    public String selected;

    public float lat;
    public float lng;
    public String parkingLotName;



    private Socket mSocket;
    {
        try{
            mSocket = IO.socket(krpURL);
        } catch (URISyntaxException e) {
            Log.i("Socket", "Invalid URI");
            Toast.makeText(this, "No Connection", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_menu);

        db_helper = new DB_Helper(getApplicationContext(), null);

        mSocket.on("data", onData);
        mSocket.connect();

        //setup for the two spinners for college and parking lot selection
        mCollegeSpinner = (Spinner) findViewById(R.id.collegeMenu);
        mParkingSpinner = (Spinner) findViewById(R.id.parkinglotMenu);

//        ArrayAdapter<String> collegeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, face_college);
//        collegeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
//        mCollegeSpinner.setAdapter(collegeAdapter);

//        ArrayAdapter<String> lotAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, face_parkinglots);
//        lotAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
//        mParkingSpinner.setAdapter(lotAdapter);

        mCollegeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {

                selected = hidden_college.get(i);
                new GetParkingDataTask().execute();
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {}
        });

        mParkingSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {
                lat = Float.parseFloat(hidden_parkinglots.get(i).get(1));
                lng = Float.parseFloat(hidden_parkinglots.get(i).get(2));
                parkingLotName = mParkingSpinner.getSelectedItem().toString();
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {}
        });
    }

    private Emitter.Listener onData = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            initial_data_from_server = (JSONObject) args[0];
            //Following cannot work. Trying to create toast on ui thread needs to made on separate thread when running inside the emitter
//            Toast.makeText(getApplicationContext(),initial_data_from_server.toString(), Toast.LENGTH_SHORT).show();
            new GetCollegeDataTask().execute();
        }
    };

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mSocket.disconnect();
        mSocket.off("data", onData);
    }

    private class GetCollegeDataTask extends AsyncTask<Object, Object, Void> {
        @Override
        protected Void doInBackground(Object... args) {

            face_college = new ArrayList<>();
            hidden_college = new ArrayList<>();


            try {
                JSONObject college_data = initial_data_from_server.getJSONObject("college_data");
                JSONObject parking_data = initial_data_from_server.getJSONObject("parking_data");

                JSONArray college_ids = college_data.getJSONArray("ids");

                for(int i = 0; i < college_ids.length(); i++){
                    int num = college_ids.getInt(i);
                    if(!db_helper.checkCollege(num)) {
                        db_helper.addCollege(num, college_data.getJSONObject(Integer.toString(num)));
                    }
                }

                ArrayList<ArrayList<String>> temp= db_helper.getAllColleges();
                for(int i = 0; i < temp.size(); i++){
                    hidden_college.add(temp.get(i).get(0));
                    face_college.add(temp.get(i).get(1));
                }

                JSONArray parkinglot_ids = parking_data.getJSONArray("ids");

                for(int i = 0; i < parkinglot_ids.length(); i++){
                    int num = parkinglot_ids.getInt(i);
                    if(!db_helper.checkParkingLot(num)) {
                        db_helper.addParkingLot(num, parking_data.getJSONObject(Integer.toString(num)));
                    }
                }




            } catch (JSONException e) {
                e.printStackTrace();
            }


            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            PopulateSpinner(mCollegeSpinner, face_college);
        }
    }



    private class GetParkingDataTask extends AsyncTask<JSONObject, Void, Void> {
        @Override
        protected Void doInBackground(JSONObject... object) {
            face_parkinglots = new ArrayList<>();
            hidden_parkinglots = new ArrayList<ArrayList<String>>();
            Log.d("KTag", "Parking LOTS-----");
            ArrayList<ArrayList<String>> temp= db_helper.getAllParkingLotsFromCollege(selected);
            for(int i = 0; i < temp.size(); i++){
                ArrayList<String> temp2 = new ArrayList<>();
                temp2.add(temp.get(i).get(0));//id
                temp2.add(temp.get(i).get(2));//lat
                temp2.add(temp.get(i).get(3));//lng
                hidden_parkinglots.add(temp2);
                face_parkinglots.add(temp.get(i).get(1));
            }
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            PopulateSpinner(mParkingSpinner, face_parkinglots);
        }
    }

    private void PopulateSpinner(Spinner spinner, ArrayList<String> list) {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, list);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter);
    }

    public void viewMap(View view){
        Intent mapIntent = new Intent(this, MapsActivity.class);
        mapIntent.putExtra("lat", lat);
        mapIntent.putExtra("lng", lng);
        mapIntent.putExtra("hidden_college", hidden_college);
        mapIntent.putExtra("face_college", face_college);
        mapIntent.putExtra("parkingLotName", parkingLotName);
        startActivity(mapIntent);
    }
}
