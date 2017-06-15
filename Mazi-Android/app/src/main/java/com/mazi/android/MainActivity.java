package com.mazi.android;

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

import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.ArrayList;

public class MainActivity extends AppCompatActivity implements OnMapReadyCallback {

    private JSONObject version_data;


    private GoogleMap mMap;
    private DB_Helper db_helper;

    String krpURL = "http://192.168.1.204:3000";

    private Spinner mCollegeSpinner;


    private ArrayList<ArrayList<String>>hidden_college;
    private ArrayList<ArrayList<String>> hidden_parkinglots;

    //arrays for spinner info
    public ArrayList<String> face_college = new ArrayList<>();
    public ArrayList<String> face_parkinglots = new ArrayList<>();

    public String selected;

    public float lat;
    public float lng;



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
        setContentView(R.layout.activity_main);

        db_helper = new DB_Helper(getApplicationContext(), null);

        mSocket.connect();

        //setup for the two spinners for college and parking lot selection
        mCollegeSpinner = (Spinner) findViewById(R.id.collegeMenu);

        new GetVersionData().execute();

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        mCollegeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {

                selected = hidden_college.get(i).get(0);
                lat = Float.parseFloat(hidden_college.get(i).get(1));
                lng = Float.parseFloat(hidden_college.get(i).get(2));

                Log.d("KTag",lat + "|"+lng);

                LatLng college = new LatLng(lat, lng);
                mMap.moveCamera(CameraUpdateFactory.newLatLng(college));
                mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(college,13));

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
                String urlstring = krpURL+"/checkVersion?ver="+ db_helper.getAllCollegeVersion();
                Log.d("KTag",urlstring);
                Log.d("KTag","GetVersionData");
                URL versionUrl = new URL(urlstring);
                HttpURLConnection myConnection = (HttpURLConnection) versionUrl.openConnection();
                myConnection.setRequestProperty("User-Agent", "android-client");
                Log.d("KTag",Integer.toString(myConnection.getResponseCode()));
                if (myConnection.getResponseCode() == 200) {
                    InputStream responseBody = myConnection.getInputStream();
                    InputStreamReader responseBodyReader  = new InputStreamReader(responseBody, "UTF-8");
                    JsonReader jsonReader = new JsonReader(responseBodyReader);

                    String var = getStringFromInputStream(responseBody);
                    version_data = new JSONObject(var);
                    Log.d("KTag",version_data.toString());

                } else {
                    Log.d("KTag","Error");
                }

            } catch (MalformedURLException e) {
                Log.d("KTag",e.toString());
                e.printStackTrace();
            } catch (IOException e) {
                Log.d("KTag",e.toString());
                e.printStackTrace();
            } catch (JSONException e) {
                Log.d("KTag",e.toString());
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
                Log.d("KTag","CheckVersion");
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
            hidden_college = new ArrayList<ArrayList<String>>();

            ArrayList<ArrayList<String>> temp= db_helper.getAllCollegesInformation();
            for(int i = 0; i < temp.size(); i++){
                ArrayList<String> temp2 = new ArrayList<>();
                temp2.add (temp.get(i).get(0));
                temp2.add (temp.get(i).get(2));
                temp2.add (temp.get(i).get(3));
                hidden_college.add(temp2);//id
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

            Log.d("KTag","PushNewData");
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



    private void PopulateSpinner(Spinner spinner, ArrayList<String> list) {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, list);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter);
    }

    public void viewMap(View view){
        Intent mapIntent = new Intent(this, MapsActivity.class);
        mapIntent.putExtra("lat", lat);
        mapIntent.putExtra("lng", lng);
        mapIntent.putExtra("selected_college",selected);
        startActivity(mapIntent);
    }

    /**
     * Manipulates the map once available.
     * This callback is triggered when the map is ready to be used.
     * This is where we can add markers or lines, add listeners or move the camera. In this case,
     * we just add a marker near Sydney, Australia.
     * If Google Play services is not installed on the device, the user will be prompted to install
     * it inside the SupportMapFragment. This method will only be triggered once the user has
     * installed Google Play services and returned to the app.
     */

    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

        LatLng college_selected = new LatLng(lat, lng);


        mMap.moveCamera(CameraUpdateFactory.newLatLng( college_selected));
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom( college_selected,17));

    }

    public void selectCollege(View view){

        Intent mapIntent = new Intent(this, MapsActivity.class);
        mapIntent.putExtra("selected_college_id", selected);
        startActivity(mapIntent);
    }





}
