package com.mazi.android;

import android.content.Context;
import android.content.Intent;
import android.os.AsyncTask;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.JsonReader;
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

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Serializable;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.ArrayList;

import javax.net.ssl.HttpsURLConnection;

public class MenuActivity extends AppCompatActivity {
    private JSONObject initial_data_from_server;
    private JSONObject version_data;


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

        mSocket.connect();

        //setup for the two spinners for college and parking lot selection
        mCollegeSpinner = (Spinner) findViewById(R.id.collegeMenu);
        mParkingSpinner = (Spinner) findViewById(R.id.parkinglotMenu);


        new GetVersionData().execute();

        mCollegeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {

                selected = hidden_college.get(i);
                new GetAllParkingtoSpinner().execute();
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




    @Override
    protected void onDestroy() {
        super.onDestroy();
        mSocket.disconnect();

    }

    private class GetVersionData extends AsyncTask<Object, Object, Void> {
        @Override
        protected Void doInBackground(Object... args) {

            try {
                String urlstring = "http://192.168.1.204:3000/checkVerison?ver="+ db_helper.getAllCollegeVersion();
                Log.d("KTag",urlstring);
                URL versionUrl = new URL(urlstring);
                HttpURLConnection myConnection = (HttpURLConnection) versionUrl.openConnection();
                myConnection.setRequestProperty("User-Agent", "android-client");
                if (myConnection.getResponseCode() == 200) {
                    InputStream responseBody = myConnection.getInputStream();
                    InputStreamReader responseBodyReader  = new InputStreamReader(responseBody, "UTF-8");
                    JsonReader jsonReader = new JsonReader(responseBodyReader);

                    String var = getStringFromInputStream(responseBody);
                    version_data = new JSONObject(var);
                    Log.d("KTag",var);

                } else {
                    Log.d("KTag","Error");
                }

            } catch (MalformedURLException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            } catch (JSONException e) {
                e.printStackTrace();
            }


            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            new CheckVersion().execute();
        }
    }

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

    private class CheckVersion extends AsyncTask<Object, Object, Void>{

        int code;
        @Override
        protected Void doInBackground(Object... params) {

            try {
                Log.d("KTag",version_data.getString("code"));
                code = version_data.getInt("code");

            } catch (JSONException e) {
                e.printStackTrace();
            }


            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            if(code == 2){
                new PushNewData().execute();
                Log.d("KTag","New Data");
            }
            else if(code == 1){
                Log.d("KTag","NO New Data");
                new GetAllCollegeToSpinner().execute();
            }
        }

    }


    private class GetAllCollegeToSpinner extends AsyncTask<Object, Object, Void>{

        @Override
        protected Void doInBackground(Object... params) {
            face_college = new ArrayList<>();
            hidden_college = new ArrayList<>();

            ArrayList<ArrayList<String>> temp= db_helper.getAllCollegesInformation();
            for(int i = 0; i < temp.size(); i++){
                hidden_college.add(temp.get(i).get(0));//id
                face_college.add(temp.get(i).get(1));//name
            }



            return null;
        }
        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            PopulateSpinner(mCollegeSpinner, face_college);
        }


    }

    private class PushNewData extends AsyncTask<Object, Object, Void> {
        @Override
        protected Void doInBackground(Object... args) {

            db_helper.clearAllTables();

            try {
                JSONObject college_data = version_data.getJSONObject("college_data");
                JSONObject parking_data = version_data.getJSONObject("parking_data");

                JSONArray college_ids = college_data.getJSONArray("ids");

                for(int i = 0; i < college_ids.length(); i++){
                    int num = college_ids.getInt(i);
                    db_helper.addCollege(num, college_data.getJSONObject(Integer.toString(num)));

                }
                JSONArray parkinglot_ids = parking_data.getJSONArray("ids");

                for(int i = 0; i < parkinglot_ids.length(); i++){
                    int num = parkinglot_ids.getInt(i);
                    db_helper.addParkingLot(num, parking_data.getJSONObject(Integer.toString(num)));

                }



            } catch (JSONException e) {
                e.printStackTrace();
            }


            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            new GetAllCollegeToSpinner().execute();
        }
    }



    private class GetAllParkingtoSpinner extends AsyncTask<JSONObject, Void, Void> {
        @Override
        protected Void doInBackground(JSONObject... object) {
            face_parkinglots = new ArrayList<>();
            hidden_parkinglots = new ArrayList<ArrayList<String>>();
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
