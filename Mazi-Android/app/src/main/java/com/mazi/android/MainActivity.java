package com.mazi.android;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.AsyncTask;
import android.support.design.widget.FloatingActionButton;
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

import static android.graphics.Paint.ANTI_ALIAS_FLAG;

public class MainActivity extends AppCompatActivity implements OnMapReadyCallback {


    //var used to saved version data from REST API
    private JSONObject version_data;


    private GoogleMap mMap;
    private DB_Helper db_helper;
    String krpURL = "http://192.168.1.204:3000";

    private Spinner mCollegeSpinner;

    //List used to store the college id, lat, lng
    private ArrayList<ArrayList<String>>hidden_college;

    //arrays for spinner info ; element match the hidden list
    public ArrayList<String> face_college = new ArrayList<>();

    //holds the college id,lat,lng of the current college id
    public String selected;
    public float lat;
    public float lng;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        //Initializes local db
        db_helper = new DB_Helper(getApplicationContext(), null);

        //Sets floating buttons
        FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.requestRideButton);
        fab.setImageBitmap(textAsBitmap("RIDE", 40, Color.WHITE ));

        FloatingActionButton fab2 = (FloatingActionButton) findViewById(R.id.requestParkingButton);
        fab2.setImageBitmap(textAsBitmap("PARK", 40, Color.WHITE ));

        //setup for the two spinners for college and parking lot selection
        mCollegeSpinner = (Spinner) findViewById(R.id.collegeMenu);

        //async runs to get new data
        new GetVersionData().execute();

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);


        mCollegeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {

                selected = hidden_college.get(i).get(0);//id
                lat = Float.parseFloat(hidden_college.get(i).get(1));
                lng = Float.parseFloat(hidden_college.get(i).get(2));
                LatLng college = new LatLng(lat, lng);
                mMap.moveCamera(CameraUpdateFactory.newLatLng(college));
                mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(college,13));
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    /*
    Async task to get the data from the checkVersion REST API
    Svaes data to the version_data var
     */
    private class GetVersionData extends AsyncTask<Object, Object, Void> {
        @Override
        protected Void doInBackground(Object... args) {
            try {
                //REST API url ; calls db method to get the largest verison
                String urlstring = krpURL+"/checkVersion?ver="+ db_helper.getAllCollegeVersion();
                Log.d("KTag","GetVersionData REST API check");
                URL versionUrl = new URL(urlstring);
                HttpURLConnection myConnection = (HttpURLConnection) versionUrl.openConnection();
                myConnection.setRequestProperty("User-Agent", "android-client");
                if (myConnection.getResponseCode() == 200) {
                    InputStream responseBody = myConnection.getInputStream();
                    InputStreamReader responseBodyReader  = new InputStreamReader(responseBody, "UTF-8");
                    JsonReader jsonReader = new JsonReader(responseBodyReader);
                    String var = getStringFromInputStream(responseBody);
                    version_data = new JSONObject(var);
                    Log.d("KTag","Sucsessful http REST API");

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

    /*
    Checks the version_data code, updates the local db if needed
     */
    private class CheckVersion extends AsyncTask<Object, Object, Void>{

        int code;
        @Override
        protected Void doInBackground(Object... params) {

            try {
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
                //in case version data is not up to date
                Log.d("KTag","checkVersion : New Data");
                new PushNewData().execute();
            }
            else if(code == 1){
                //in case local db had up to date data
                Log.d("KTag","checkVersion : NO New Data");
                new GetAllCollegeToSpinner().execute();
            }
        }
    }

    /*
    Updates the college spinner with data from the local db
     */

    private class GetAllCollegeToSpinner extends AsyncTask<Object, Object, Void>{

        @Override
        protected Void doInBackground(Object... params) {
            face_college = new ArrayList<>();
            hidden_college = new ArrayList<ArrayList<String>>();

            ArrayList<ArrayList<String>> temp= db_helper.getAllCollegesInformation();
            for(int i = 0; i < temp.size(); i++){
                ArrayList<String> temp2 = new ArrayList<>();
                temp2.add (temp.get(i).get(0));//id
                temp2.add (temp.get(i).get(2));//lat
                temp2.add (temp.get(i).get(3));//lng
                hidden_college.add(temp2);//id,lat,lng
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

    /*
    Async task used to push new data
    Pushes data from version_data var
     */
    private class PushNewData extends AsyncTask<Object, Object, Void> {
        @Override
        protected Void doInBackground(Object... args) {

            Log.d("KTag","PushNewData");
            //first will clear all of the data from both local db tables for colleges and parking
            db_helper.clearAllTables();

            try {
                //breaks up college data and parking data into vars
                JSONObject college_data = version_data.getJSONObject("college_data");
                JSONObject parking_data = version_data.getJSONObject("parking_data");

                //parses array of ids to get all of the college data
                JSONArray college_ids = college_data.getJSONArray("ids");

                //pushes data from college into the local db table for colleges
                for(int i = 0; i < college_ids.length(); i++){
                    int num = college_ids.getInt(i);
                    db_helper.addCollege(num, college_data.getJSONObject(Integer.toString(num)));
                }

                //parses array of ids to get all of the parking data
                JSONArray parkinglot_ids = parking_data.getJSONArray("ids");

                //pushes data from college into the local db table for parking
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
            //updates spinner data
            new GetAllCollegeToSpinner().execute();
        }
    }




    private void PopulateSpinner(Spinner spinner, ArrayList<String> list) {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, list);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter);
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

    //method that calls next intent in case RIDE button is clicked
    public void requestRide(View view) {
        Intent mapIntent = new Intent(this, ParkingMapsActivity.class);
        mapIntent.putExtra("selected_college_id", selected);
        mapIntent.putExtra("type","ride");
        startActivity(mapIntent);
    }

    //method that calls next intent in case PARK button is clicked
    public void requestParking(View view) {
        Intent mapIntent = new Intent(this, ParkingMapsActivity.class);
        mapIntent.putExtra("selected_college_id", selected);
        mapIntent.putExtra("type","park");
        startActivity(mapIntent);
    }



    /*
    Method used to put text in the floating buttons
     */
    public static Bitmap textAsBitmap(String text, float textSize, int textColor) {
        Paint paint = new Paint(ANTI_ALIAS_FLAG);
        paint.setTextSize(textSize);
        paint.setColor(textColor);
        paint.setTextAlign(Paint.Align.LEFT);
        float baseline = -paint.ascent(); // ascent() is negative
        int width = (int) (paint.measureText(text) + 0.0f); // round
        int height = (int) (baseline + paint.descent() + 0.0f);
        Bitmap image = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);

        Canvas canvas = new Canvas(image);
        canvas.drawText(text, 0, baseline, paint);
        return image;
    }





}
