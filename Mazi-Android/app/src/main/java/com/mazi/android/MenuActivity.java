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
    private JSONObject datafile;
    private DB_Helper db_helper;

    String bpURL = "http://192.168.0.16:3000";
    String krpURL = "http://192.168.1.204:3000";

    private Socket mSocket;
    {
        try{
            mSocket = IO.socket(bpURL);
        } catch (URISyntaxException e) {
            Log.i("Socket", "Invalid URI");
        }
    }

    private Spinner mCollegeSpinner;
    private Spinner mParkingSpinner;

    //arrays for spinner info
    public ArrayList<String> colleges = new ArrayList<>();
    public ArrayList<String> lots = new ArrayList<>();

//    public String[] colleges = {"Cal Poly Pomona", "Cal Poly SLO", "Mt. Sac"};
//    public String[] lots = {"Parking Lot J", "Parking Lot M", "Parking Structure 2"};

    public String selected;

    public float lat;
    public float lng;
    public String parkingLotName;

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

//        ArrayAdapter<String> collegeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, colleges);
//        collegeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
//        mCollegeSpinner.setAdapter(collegeAdapter);

//        ArrayAdapter<String> lotAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, lots);
//        lotAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
//        mParkingSpinner.setAdapter(lotAdapter);

        mCollegeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {

                selected = "10001" + Integer.toString(i);
                Toast.makeText(getApplicationContext(),selected,Toast.LENGTH_SHORT).show();
                new GetParkingDataTask().execute();
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {}
        });

        mParkingSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {
                setCoordinates(lots.get(i));
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {}
        });
    }

    private void setCoordinates(String lot) {
        String slat="", slng="";
        try {
            JSONObject subData = datafile.getJSONObject("parking_data");
            for (int i = 2001; i <= 2010; i++){
                if (subData.getJSONObject(Integer.toString(i)).getString("parkinglot_name").equals(lot)) {
                    slat = subData.getJSONObject(Integer.toString(i)).getString("coor_lat");
                    slng = subData.getJSONObject(Integer.toString(i)).getString("coor_lng");
                    break;
                }
            }
            lat = Float.parseFloat(slat);
            lng = Float.parseFloat(slng);
            parkingLotName = lot;
        } catch (JSONException e) {}

    }

    private Emitter.Listener onData = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            datafile = (JSONObject) args[0];
            //Following cannot work. Trying to create toast on ui thread needs to made on separate thread when running inside the emitter
//            Toast.makeText(getApplicationContext(),datafile.toString(), Toast.LENGTH_SHORT).show();
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

            colleges = new ArrayList<>();
            try {
                JSONObject college_data = datafile.getJSONObject("college_data");
                JSONObject parking_data = datafile.getJSONObject("parking_data");

                JSONArray college_ids = college_data.getJSONArray("ids");

                for(int i = 0; i < college_ids.length(); i++){
                    int num = college_ids.getInt(i);
                    if(!db_helper.checkCollege(num)) {
                        db_helper.addCollege(num, college_data.getJSONObject(Integer.toString(num)));
                    }
                }

                JSONArray parkinglot_ids = parking_data.getJSONArray("ids");

                for(int i = 0; i < parkinglot_ids.length(); i++){
                    int num = parkinglot_ids.getInt(i);
                    if(!db_helper.checkParkingLot(num)) {
                        db_helper.addParkingLot(num, parking_data.getJSONObject(Integer.toString(num)));
                    }
                }

                colleges = db_helper.getAllColleges();

            } catch (JSONException e) {
                e.printStackTrace();
            }


            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            PopulateSpinner(mCollegeSpinner, colleges);
        }
    }



    private class GetParkingDataTask extends AsyncTask<JSONObject, Void, Void> {
        @Override
        protected Void doInBackground(JSONObject... object) {
            lots = new ArrayList<>();
            Log.d("KTag", "Parking LOTS-----");
            lots = db_helper.getAllParkingLotsFromCollege(selected);
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            PopulateSpinner(mParkingSpinner, lots);
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
        mapIntent.putExtra("parkingLotName", parkingLotName);
        startActivity(mapIntent);
    }
}
